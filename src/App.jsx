import { useState , useEffect} from 'react'
import './App.css'
import { supabase } from './supabase'

function App() {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [note, setNote] = useState('')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState([])
  const [user, setUser] = useState(null)

  async function saveNote() {

  const { data, error } = await supabase
    .from('notes')
    .insert([
      {
        title: title,
        content: note,
        user_id: user.id
      }
    ])

  if(error){
    alert(error.message)
  } else {
    alert('Note saved!')
    getNotes()
    console.log(data)
  }
}
async function getNotes(currentUser = user) {

  if(!currentUser) return

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', currentUser.id)

  if(error){
    console.log(error)
  } else {
    setNotes(data)
  }
}
async function login() {

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  })

  if(error){
    alert(error.message)
  } else {
    alert('Login successful!')
    setUser(data.user)
    getNotes()
  }
}
async function signUp() {

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password
  })

  if(error){
    alert(error.message)
  } else {
    alert('Signup successful!')
    console.log(data)
  }
}
async function getSession() {
  const {data } = await supabase.auth.getSession()
  const currentUser = data.session?.user || null
  setUser(currentUser)
  if(currentUser){
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
async function deleteNote(id) {

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)

  if(error){
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

  return (
    <div className="container">

      <h1>StudyHub</h1>
      <p>Status:{user ? 'Logged in' : 'Not logged in  '}</p>
{
  user && <p>logged in as: {user.email}  </p>
}
      <input
        type="email"
        placeholder="Enter email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <br /><br />

      <input
        type="password"
        placeholder="Enter password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <br /><br />

<input
        type="text"
        placeholder="Enter title"
        onChange={(e) => setTitle(e.target.value)}
      />
      <br /><br /> 
      <input
        type="text"
        placeholder="Enter note"
        onChange={(e) => setNote(e.target.value)}
      />
      <br /><br />

      <button onClick={signUp}>Sign Up</button>
      <br /><br />
<button onClick = {login}>Login </button>
      <br /><br />

      
     <button className="save-btn" onClick={saveNote}>
  Save Note
</button>
<br /><br />

<button className="logout-btn" onClick={logout}>
  Logout
</button>
<h2>Saved Notes</h2>

{
  Object.entries(
    notes.reduce((groups, item) => {

      if (!groups[item.title]) {
        groups[item.title] = []
      }

      groups[item.title].push(item)

      return groups

    }, {})
  ).map(([title, items]) => (

    <div key={title} className="note-card">

      <h2>{title}</h2>

      {
        items.map((item) => (
          <div key={item.id} className="note-card">

            <p>{item.content}</p>

            <button className="delete-btn" onClick={() => deleteNote(item.id)}>
              Delete
            </button>

            <br /><br />

          </div>
        ))
      }

      <hr />

    </div>
  ))
}
{!user && <h2>Please Login</h2>}  
    </div>
  )
}

export default App