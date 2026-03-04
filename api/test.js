module.exports = function handler(req, res) {
  res.json({ ok: true, time: Date.now(), msg: 'API is working' })
}
