import {
  createOrdersFees,
  createOrderDistributions
} from './utils.js'

export function routes(server) {

  server.get('/', (req, res) => {
    res.send('ok');
  });

  server.post('/prices', (req, res) => {
    let reqArray = req.body;
    res.send(createOrdersFees(reqArray));
  })

  server.post('/distributions', (req, res) => {
    let reqArray = req.body;
    res.send(createOrderDistributions(reqArray));
  })
}