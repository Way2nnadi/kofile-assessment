import express from 'express';
import bodyParser from 'body-parser';
import {routes} from './routes';

// DEFINE VARIABLES
let server = express();     

// MIDDLEWARE
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({extended: true}));

// HOMEPAGE MIDDLEWARE
// server.use('/', express.static(__dirname + '/public'));


// ROUTES
routes(server);

server.listen(process.env.PORT || 3000, () => {
  console.log(`Listening on Port: ${process.env.PORT || 3000}`);
})