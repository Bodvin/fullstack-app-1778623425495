import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [authLoading, setAuthLoading] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)

  const [authView, setAuthView] = useState('login')
  const [activePage, setActivePage] = useState('oversikt')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const [user, setUser] = useState(null)
  const [contacts, setContacts] = useState([])

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.log(error)
      return
    }

    const currentUser = data.session?.user ?? null

    setUser(currentUser)

    if (currentUser?.email) {
      await loadContacts(currentUser.email)
    }
  }

  async function loadContacts(userEmail) {
    if (!userEmail) return

    setError('')

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .ilike('email', userEmail)
      .order('name', { ascending: true })

    if (error) {
      setError(error.message)
      return
    }

    setContacts(data || [])
  }

  async function handleLogin(e) {
    e.preventDefault()

    setAuthLoading(true)
    setError('')
    setMessage('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setAuthLoading(false)
      return
    }

    const currentUser = data.user

    setUser(currentUser)

    if (currentUser?.email) {
      await loadContacts(currentUser.email)
    }

    setAuthLoading(false)
  }

  async function handleRegister(e) {
    e.preventDefault()

    setAuthLoading(true)
    setError('')
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })

    if (error) {
      setError(error.message)
      setAuthLoading(false)
      return
    }

    setMessage('Bruker registrert ✅ Du kan nå logge inn.')
    setAuthView('login')

    setAuthLoading(false)
  }

  async function handleLogout() {
    setLogoutLoading(true)

    await supabase.auth.signOut()

    setUser(null)
    setContacts([])

    setEmail('')
    setPassword('')

    setActivePage('oversikt')

    setLogoutLoading(false)
  }

  function NavButton({ id, children }) {
    return (
      <button
        onClick={() => setActivePage(id)}
        className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition ${
          activePage === id
            ? 'bg-indigo-600 text-white'
            : 'bg-transparent hover:bg-gray-800 text-gray-300'
        }`}
      >
        {children}
      </button>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex p-6 gap-8">
        <aside className="w-64 bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-10">
              Privat
              <br />
              Dashboard
            </h1>

            <nav className="space-y-4">
              <NavButton id="oversikt">Oversikt</NavButton>
              <NavButton id="meldinger">Meldinger</NavButton>
              <NavButton id="konto">Konto</NavButton>
            </nav>

            <div className="space-y-5 mt-12">
              <div className="bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-700">
                <h3 className="font-bold text-lg mb-1">Status</h3>
                <p className="text-green-400 text-sm font-semibold">
                  Tilgang til privat innhold
                </p>
              </div>

              <div className="bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-700">
                <h3 className="font-bold text-lg mb-1">Konto</h3>
                <p className="text-gray-300 text-sm break-words font-medium">
                  {user.email}
                </p>
              </div>

              <div className="bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-700">
                <h3 className="font-bold text-lg mb-1">Meldinger</h3>
                <p className="text-gray-300 text-sm font-semibold">
                  {contacts.length} lagrede meldinger
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            className="w-full mt-8 bg-red-600 hover:bg-red-700 transition rounded-xl py-3 font-bold"
          >
            {logoutLoading ? 'Logger ut...' : 'Logg ut'}
          </button>
        </aside>

        <main className="flex-1">
          <h1 className="text-5xl font-bold mb-10">
            Velkommen, {user.user_metadata?.name || user.email}!
          </h1>

          {error && (
            <div className="mb-6 bg-red-900 border border-red-700 rounded-2xl p-4 text-red-400 font-semibold">
              {error}
            </div>
          )}

          {activePage === 'oversikt' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 shadow-md flex flex-col justify-center items-center">
                <h2 className="text-2xl font-bold mb-4">Status</h2>
                <p className="text-green-400 font-semibold text-lg">Dashboardet er aktivt.</p>
              </div>

              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 shadow-md flex flex-col justify-center items-center">
                <h2 className="text-2xl font-bold mb-4">Meldinger</h2>
                <p className="text-gray-300 text-xl font-semibold">
                  {contacts.length} {contacts.length === 1 ? 'melding' : 'meldinger'} lagret.
                </p>
              </div>

              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 shadow-md flex flex-col justify-center items-center break-words">
                <h2 className="text-2xl font-bold mb-4">Konto</h2>
                <p className="text-gray-300 text-center font-medium truncate max-w-full">
                  {user.email}
                </p>
              </div>
            </div>
          )}

          {activePage === 'meldinger' && (
            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold">Kontaktmeldinger</h2>

                <button
                  onClick={() => loadContacts(user.email)}
                  className="bg-indigo-600 hover:bg-indigo-700 transition px-5 py-3 rounded-xl font-bold"
                >
                  Oppdater
                </button>
              </div>

              {contacts.length === 0 ? (
                <p className="text-gray-400">Ingen meldinger funnet.</p>
              ) : (
                <div className="space-y-5">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="bg-gray-950 border border-gray-800 rounded-xl p-5"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="font-bold text-xl">
                            {contact.name}
                          </h3>

                          <p className="text-sm text-gray-400">
                            {contact.email}
                          </p>
                        </div>
                      </div>

                      <p className="text-gray-300 whitespace-pre-wrap">
                        {contact.message}
                      </p>

                      {contact.created_at && (
                        <p className="text-xs text-gray-500 mt-4">
                          {new Date(contact.created_at).toLocaleString('no-NO')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activePage === 'konto' && (
            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-3xl font-bold mb-6">Konto</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm">E-post</p>
                  <p className="text-lg">{user.email}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">Bruker-ID</p>
                  <p className="text-sm break-all">{user.id}</p>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 text-white">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-5xl font-bold text-center mb-8">
          {authView === 'login' ? 'Logg inn' : 'Registrer'}
        </h1>

        <form
          onSubmit={
            authView === 'login'
              ? handleLogin
              : handleRegister
          }
          className="space-y-5"
        >
          {authView === 'register' && (
            <input
              type="text"
              placeholder="Navn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3"
            />
          )}

          <input
            type="email"
            placeholder="E-post"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3"
          />

          <input
            type="password"
            placeholder="Passord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3"
          />

          {error && (
            <p className="text-red-400 text-sm">
              Feil: {error}
            </p>
          )}

          {message && (
            <p className="text-green-400 text-sm">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 transition py-3 rounded-xl font-bold"
          >
            {authLoading
              ? authView === 'login'
                ? 'Logger inn...'
                : 'Registrerer...'
              : authView === 'login'
              ? 'Logg inn'
              : 'Registrer'}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6">
          {authView === 'login' ? (
            <>
              Ny her?{' '}
              <button
                onClick={() => {
                  setAuthView('register')
                  setError('')
                  setMessage('')
                }}
                className="text-indigo-400 font-bold"
              >
                Registrer deg
              </button>
            </>
          ) : (
            <>
              Har du konto?{' '}
              <button
                onClick={() => {
                  setAuthView('login')
                  setError('')
                  setMessage('')
                }}
                className="text-indigo-400 font-bold"
              >
                Logg inn
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
