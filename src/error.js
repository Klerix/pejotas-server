module.exports = (error, res) => {
  console.error(error)
  res.send(500, error)
}
