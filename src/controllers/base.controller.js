export const baseExample = async (req, res) => {
  try {
    // const data = await getExampleData(); Habilitar conexion a la base de datos
    const data = [{ example: 1 }]; // Datos de ejemplo sin conexion a la base de datos
    res.json({ message: 'API base funcionando correctamente', data });
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar la base de datos', details: error.message });
  }
};
