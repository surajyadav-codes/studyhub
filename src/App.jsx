import { useState } from 'react'
import './App.css'
import { supabase } from './supabase'

function App() {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [note, setNote] = useState('')

  async function saveNote() {

    const { data, error } = await supabase
      .from('notes')
      .insert([
        { content: note }
      ])

    if(error){
      alert(error.message)
    } else {
      alert('Note saved!')
      console.log(data)
    }
  }

  return (
    <div>

      <h1>StudyHub</h1>

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
        placeholder="Enter note"
        onChange={(e) => setNote(e.target.value)}
      />

      <br /><br />

      <button onClick={saveNote}>
        Save Note
      </button>

    </div>
  )
}

export default App