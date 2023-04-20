const ValidarImagenes = ({ tipo }) => {
  const formatos = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml']
  return formatos.includes(tipo)
}

export default ValidarImagenes
