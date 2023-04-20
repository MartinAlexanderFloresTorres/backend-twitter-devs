const ValidarImagenesVideos = ({ tipo }) => {
  const formatos = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4']
  return formatos.includes(tipo)
}

export default ValidarImagenesVideos
