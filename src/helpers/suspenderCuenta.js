const suspenderCuenta = async (texto, usuario) => {
  // Expresión regular para buscar malas palabras
  const patron =
    /\b(cagada|invecil|estupido|inbecil|maldito|joder|puta|carajo|coño|malparido|mamerto|manfloro|maraco|marica|maricona|meando fuera del perol |ctmr|la concha de tu madre|meapilas|megachupapollas|metepatas|mierda|moco|mona|moñeco|moquete|morro|mucamo|muégano|muerto de hambre|nabo|naco|nalgón|narco|ñángara|ñángaro|nazi|nefasto|negro de mierda|nervioso|nigga|novato|novicio|nulo|obsceno|oco|olor de huevos|onda|orate|ordinario|pagafantas|pajearse|palanca|palurdo|panchito|panocha|panzón|papanatas|paralítico|pata|patán|pavo|pedazo de mierda|pendejo|pijo|pinga|pingüino|pinocho|pintamonas|piruja|pisar la manguera|pito|pobreton|pobretón|poca cosa|podrido|poquero|porquería|poto|pringado|pulga|puta|putamadre|putazo|putero|puto|quebrado|quítate tú pa ponerme yo|rabón|rabieta|rabo|racista|rajar|ramera|ramplón|rancio|ranfla|reata|recauchutado|recule|redículo|retardado|revolcón|rizado|roñoso|rucho|rufián|sangano|sanguijuela|sapo|sarnoso|semental|simio|sinvergüenza|soez|sonso|soplón|sordo|subnormal|sudaca|sudoroso|suertudo|sujetavagos|tacaño|tapa boca|tarado|tarugo|tembloroso|tenso|testarudo|timorato|tirapiedras|tontaina|tonto|torcido|torpe|tragón|tragona|travesti|triquiñuela|troglodita|trompudo)\b/i

  // Buscar coincidencias en el texto usando la expresión regular
  const coincidencias = texto.match(patron)

  // Si se encontró una coincidencia, suspender al usuario
  if (coincidencias !== null) {
    const fechaExpiracion = new Date()
    fechaExpiracion.setDate(fechaExpiracion.getDate() + 6) // Agregar 6 días
    usuario.suspendido = true
    usuario.expiracionSuspendido = fechaExpiracion
    await usuario.save()
  }

  // Devolver la primera coincidencia encontrada, o null si no se encontró ninguna
  return coincidencias ? coincidencias[0] : null
}

export default suspenderCuenta
