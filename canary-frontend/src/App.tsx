import { useEffect, useState, KeyboardEvent } from 'react'
import {
  Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle, Trash, Pencil, Plus, Check
} from 'lucide-react'

const API_BASE = 'http://localhost:8000/api/items'

interface Todo {
  id: number
  name: string
  description: string
  completed?: boolean // Optional, since Sanic may not return it
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    fetch(API_BASE)
      .then(res => res.json())
      .then(data => setTodos(data.items))
  }, [])

  const addTodo = async () => {
    if (!input.trim()) return

    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: input, description: 'Added from frontend' }),
    })
    const data = await res.json()
    setTodos([...todos, data.item])
    setInput('')
  }

  const deleteTodo = async (id: number) => {
    await fetch(`${API_BASE}/${id}`, { method: 'DELETE' })
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const toggleTodo = async (id: number) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return

    const updated = {
      ...todo,
      completed: !todo.completed,
    }

    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })

    if (res.ok) {
      setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
    }
  }

  const startEdit = (todo: Todo) => {
    setEditId(todo.id)
    setEditText(todo.name)
  }

  const saveEdit = async () => {
    if (editId === null) return

    const res = await fetch(`${API_BASE}/${editId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editText, description: 'Updated from frontend' }),
    })

    if (res.ok) {
      setTodos(todos.map(todo =>
        todo.id === editId ? { ...todo, name: editText } : todo
      ))
      setEditId(null)
      setEditText('')
    }
  }

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') saveEdit()
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Todo App</h1>
          <p className="text-muted-foreground">Connected to Sanic backend</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add a new task</CardTitle>
            <CardDescription>Type your task and click add</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter todo"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <Button onClick={addTodo}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Todo List</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {todos.length === 0 ? (
              <p className="text-muted-foreground text-center">No todos yet.</p>
            ) : (
              todos.map((todo) => (
                <Card key={todo.id} className="border p-4 flex justify-between items-center">
                  <div className="flex-1">
                    {editId === todo.id ? (
                      <Input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        autoFocus
                      />
                    ) : (
                      <span
                        className={`text-lg cursor-pointer ${todo.completed ? 'line-through text-muted-foreground' : ''}`}
                        onClick={() => toggleTodo(todo.id)}
                      >
                        {todo.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant="outline">
                      {todo.completed ? 'Done' : 'Active'}
                    </Badge>

                    {editId === todo.id ? (
                      <Button size="sm" onClick={saveEdit}>
                        <Check className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => startEdit(todo)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteTodo(todo.id)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </CardContent>
          {todos.length > 0 && (
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Click text to toggle completion. Edit or delete with buttons.
              </p>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}

export default App
