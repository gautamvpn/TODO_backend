from sanic import Sanic
from sanic.response import json
from sanic_cors import CORS
import aiosqlite

app = Sanic("server-boilerplate")
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

DB_NAME = "todos.db"

@app.before_server_start
async def setup_db(app, _):
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT
            )
        """)
        await db.commit()

@app.get("/ping")
async def ping(request):
    return json({"message": "pong"}, status=200)

@app.get("/api/items")
async def get_items(request):
    try:
        async with aiosqlite.connect(DB_NAME) as db:
            cursor = await db.execute("SELECT id, name, description FROM items")
            rows = await cursor.fetchall()
            items = [{"id": r[0], "name": r[1], "description": r[2]} for r in rows]
        return json({"items": items}, status=200)
    except Exception as e:
        return json({"error": str(e)}, status=500)

@app.post("/api/items")
async def create_item(request):
    try:
        data = request.json
        if not data or "name" not in data:
            return json({"error": "Missing 'name' in request body"}, status=400)
        
        name = data["name"]
        description = data.get("description", "")

        async with aiosqlite.connect(DB_NAME) as db:
            cursor = await db.execute(
                "INSERT INTO items (name, description) VALUES (?, ?)", (name, description)
            )
            await db.commit()
            item_id = cursor.lastrowid

        new_item = {"id": item_id, "name": name, "description": description}
        return json({"item": new_item, "message": "Item created successfully"}, status=201)
    except Exception as e:
        return json({"error": str(e)}, status=500)

@app.put("/api/items/<item_id:int>")
async def update_item(request, item_id):
    try:
        data = request.json
        if not data or "name" not in data:
            return json({"error": "Missing 'name' in request body"}, status=400)

        async with aiosqlite.connect(DB_NAME) as db:
            cursor = await db.execute("SELECT id FROM items WHERE id = ?", (item_id,))
            if not await cursor.fetchone():
                return json({"error": f"Item with id {item_id} not found"}, status=404)

            await db.execute(
                "UPDATE items SET name = ?, description = ? WHERE id = ?",
                (data["name"], data.get("description", ""), item_id)
            )
            await db.commit()

        updated_item = {"id": item_id, "name": data["name"], "description": data.get("description", "")}
        return json({"item": updated_item, "message": "Item updated successfully"}, status=200)
    except Exception as e:
        return json({"error": str(e)}, status=500)

@app.delete("/api/items/<item_id:int>")
async def delete_item(request, item_id):
    try:
        async with aiosqlite.connect(DB_NAME) as db:
            cursor = await db.execute("SELECT id FROM items WHERE id = ?", (item_id,))
            if not await cursor.fetchone():
                return json({"error": f"Item with id {item_id} not found"}, status=404)

            await db.execute("DELETE FROM items WHERE id = ?", (item_id,))
            await db.commit()

        return json({"message": f"Item {item_id} deleted successfully"}, status=200)
    except Exception as e:
        return json({"error": str(e)}, status=500)

@app.get("/api/protected")
async def protected_route(request):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return json({"error": "Unauthorized - Missing or invalid token"}, status=401)

        token = auth_header.replace('Bearer ', '')
        if token != "valid-token":
            return json({"error": "Forbidden - Invalid credentials"}, status=403)

        return json({"message": "You have access to protected data"}, status=200)
    except Exception as e:
        return json({"error": str(e)}, status=500)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
