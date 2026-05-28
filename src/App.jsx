import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
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
  const [pdfFile, setPdfFile] = useState(null)
  

async function saveNote() {

  if (!note && !pdfFile) {
  alert('Write note or upload PDF')
  return
}
  if (!user) {
    alert('Please login first')
    return
  }

  let pdfUrl = ''

  // PDF upload section
  if (pdfFile) {

    // unique file name
    const fileName =
      `${Date.now()}-${pdfFile.name}`

    // upload to Supabase storage
    const {
      data: uploadData,
      error: uploadError
    } = await supabase.storage
      .from('notes-pdf')
      .upload(fileName, pdfFile)

    // if upload is fail 
    if (uploadError) {
      alert(uploadError.message)
      return
    }

    // public URL generate
    const { data } = supabase.storage
      .from('notes-pdf')
      .getPublicUrl(fileName)

    pdfUrl = data.publicUrl
  }

  // database save
  const { error } = await supabase
    .from('notes')
    .insert([
      {
        title: title.trim().toLowerCase(),
        content: note,
        pdf_url: pdfUrl,
        user_id: user.id,
        is_public: true,
      },
    ])

  if (error) {
    alert(error.message)
  } else {

    alert('Note uploaded!')

    setTitle('')
    setNote('')
    setPdfFile(null)

    getNotes()
  }
}

 async function getNotes() {

  const { data, error } = await supabase
    .from('notes')
    .select('*')

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
   getNotes(currentUser)
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
function downloadPDF(title, items) {

  // Agar uploaded PDF hai
  if (items[0].pdf_url) {

    window.open(items[0].pdf_url, '_blank')
    return
  }

  // Agar sirf text notes hain
  const doc = new jsPDF()

  doc.setFontSize(22)

  doc.text(
    title.toUpperCase(),
    20,
    20
  )

  let y = 40

  items.forEach((item, index) => {

    const text =
      `${index + 1}. ${item.content}`

    const splitText =
      doc.splitTextToSize(text, 170)

    doc.setFontSize(14)

    doc.text(splitText, 20, y)

    y += splitText.length * 10

    y += 10
  })

  doc.save(`${title}.pdf`)
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
      <div className="navbar">
  <h1>StudyHub</h1>


</div>
      <p>Status: {user ? 'Logged in' : 'Not logged in'}</p>
      {user && <p>Logged in as: {user.email}</p>}

     {!user && (
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
)}

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
          <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setPdfFile(e.target.files[0])}
         />
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
           {openTitle === title ? '▼' : '▶'} 
{title.charAt(0).toUpperCase() + title.slice(1)}
          </h2>
          
{
  user ? (

    <button
      className="pdf-btn"
      onClick={() =>
        downloadPDF(title, items)
      }
    >
      Download PDF
    </button>

  ) : (

    <button
      className="pdf-btn"
      onClick={() =>
        alert('Login to download PDF')
      }
    >
      Download PDF
    </button>

  )
}

{
  items[0].pdf_url && (

    <a
      href={items[0].pdf_url}
      target="_blank"
      rel="noreferrer"
    >

      <button className="pdf-btn">
        View PDF
      </button>

    </a>
  )
}
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