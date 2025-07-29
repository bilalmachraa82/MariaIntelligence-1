import React from 'react'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>🏠 Maria Faz</h1>
        <p>Gestão Inteligente de Propriedades</p>
        <div className="status-indicators">
          <div className="status-item">
            <span className="status-dot green"></span>
            <span>Sistema Online</span>
          </div>
          <div className="status-item">
            <span className="status-dot green"></span>
            <span>Base de Dados Conectada</span>
          </div>
          <div className="status-item">
            <span className="status-dot green"></span>
            <span>OCR Disponível</span>
          </div>
        </div>
      </header>
    </div>
  )
}

export default App