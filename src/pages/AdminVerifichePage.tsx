import { useEffect } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'

function AdminVerifichePage() {
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('identity_verifications')
        .select('*')

      console.log('VERIFICHE', data)
      console.log('ERRORE', error)
    }

    load()
  }, [])

  return (
    <div className="landing">
      <Header />

      <main className="page-main">
        <section className="section page-section">
          <div className="container page-container">
            <h1>Admin verifiche</h1>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default AdminVerifichePage