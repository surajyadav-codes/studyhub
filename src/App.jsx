import { useState, useEffect } from 'react'
import './App.css'
import { supabase } from './supabase'

function App() {
  const [email, setEmail] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editedText, setEditedText] = useState('')
  const [password, setPassword] = useState('')
  const [note, setNote] = useState('')
  const [title, setTitle] = useState('')
  const [search, setSearch] = useState('')
  const [openTitle, setOpenTitle] = useState(null)
  const [notes, setNotes] = useState([])
  const [user, setUser] = useState(null)

  async function saveNote() {
    if (!user) {
      alert('Please login before saving a note.')
      return
    }

    const { data, error } = await supabase.from('notes').insert([
      {
        title,
        content: note,
        user_id: user.id,
      },
    ])

    if (error) {
      alert(error.message)
    } else {
      alert('Note saved!')
      setNote('')
      setTitle('')
      getNotes()
      console.log(data)
    }
  }

  async function getNotes(currentUser = user) {
    if (!currentUser) return

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', currentUser.id)

    if (error) {
      console.log(error)
    } else {
      setNotes(data)
    }
  }

  async function login() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Login successful!')
      setUser(data.user)
      getNotes(data.user)
    }
  }

  async function signUp() {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Signup successful!')
      console.log(data)
    }
  }

  async function getSession() {
    const { data } = await supabase.auth.getSession()
    const currentUser = data.session?.user || null
    setUser(currentUser)
    if (currentUser) {
      getNotes(currentUser)
    }
  }

  useEffect(() => {
    getSession()

    const channel = supabase
      .channel('notes-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
        },
        () => {
          getNotes()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function updateNote(id) {

  const { error } = await supabase
    .from('notes')
    .update({
      content: editedText
    })
    .eq('id', id)

  if(error){
    alert(error.message)
  } else {
    alert('Note updated!')
    setEditingId(null)
    getNotes()
  }
}
  async function deleteNote(id) {
    const { error } = await supabase.from('notes').delete().eq('id', id)

    if (error) {
      alert(error.message)
    } else {
      alert('Note deleted!')
      getNotes()
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    alert('Logged out!')
    setUser(null)
    setNotes([])
  }

  const groupedNotes = notes.reduce((groups, item) => {
    if (!groups[item.title]) {
      groups[item.title] = []
    }
    groups[item.title].push(item)
    return groups
  }, {})

  return (
    <div className="container">
      <h1>StudyHub</h1>
      <p>Status: {user ? 'Logged in' : 'Not logged in'}</p>
      {user && <p>Logged in as: {user.email}</p>}

      <div className="auth-section">
        <input
          type="email"
          value={email}
          placeholder="Enter email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <input
          type="password"
          value={password}
          placeholder="Enter password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <button onClick={signUp}>Sign Up</button>
        <button onClick={login}>Login</button>
      </div>

      {user && (
        <div className="note-section">
          <input
            type="text"
            value={title}
            placeholder="Enter title"
            onChange={(e) => setTitle(e.target.value)}
          />
          <br />
          <input
            type="text"
            value={note}
            placeholder="Enter note"
            onChange={(e) => setNote(e.target.value)}
          />
          <br />
          <button className="save-btn" onClick={saveNote}>
            Save Note
          </button>
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      )}

<input
  type="text"
  placeholder="Search notes..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>

<br /><br />
      <h2>Saved Notes</h2>
      {Object.entries(groupedNotes).filter(([title]) =>
  title.toLowerCase().includes(search.toLowerCase())
).map(([title, items]) => (
        <div key={title} className="note-card">
          <h2
            className="title-heading"
            onClick={() =>
              setOpenTitle(openTitle === title ? null : title)
            }
          >
            {openTitle === title ? '▼' : '▶'} {title}
          </h2>
          {openTitle === title &&
            items.map((item) => (
              <div key={item.id} className="note-row">
 {
  editingId === item.id ? (

    <input
      type="text"
      value={editedText}
      onChange={(e) => setEditedText(e.target.value)}
    />

  ) : (

    <p>{item.content}</p>

  )
}
{
  editingId === item.id ? (

    <button
      className="save-btn"
      onClick={() => updateNote(item.id)}
    >
      Save
    </button>

  ) : (

    <button
      onClick={() => {
        setEditingId(item.id)
        setEditedText(item.content)
      }}
    >
      Edit
    </button>

  )
}
                <button
                  className="delete-btn"
                  onClick={() => deleteNote(item.id)}
                >
                  Delete
                </button>
              </div>
            ))}
        </div>
      ))}
    </div>
  )
}
export default App