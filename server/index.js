const axios = require('axios')
var express = require('express');
var cors = require('cors')
var app = express();
app.use(cors())
const authUrl = 'https://forms.office.com/formapi/api/decomposition/GetImmersiveReaderToken?formId=DQSIkWdsW0yxEjajBLZtrQAAAAAAAAAAAAZAABP_A4tUMkc4RUY1NDg2TVQ1SlJITVpIT0g1SzdXWC4u'
app.get('/token', function (req, res) {
  axios.get(authUrl).then(({ data }) => res.send(data))
})

var server = app.listen(8081, function () {
  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)
})