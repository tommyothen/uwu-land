# UwU Land

A developer first URL shortener with REST API interactions.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Installing

A step by step series of examples that tell you how to get a development env running

Clone the repository repository

```
git clone https://github.com/DaSushiAsian/uwu-land
```

Enter in to the newly cloned repo

```
cd uwu-land
```

Install the dependencies

```
npm install
```

Create an environment '.env' file with similar contents

```
PORT=4550
SISTER_PORT=4551
SELF_DOMAIN=uwu.land
SISTER_DOMAIN=app.uwu.land
```

Run the program without nodemon

```
npm start
```

Run the program with nodemon

```
npm run dev
```

## Deployment

To run this on a live system, run the same steps as development but with the environment variable

```
NODE_ENV=production
```

Either in '.env' or with the command

```
npm run prod
```

## Authors

* **Tommy Othen** - *Initial work* - [DaSushiAsian](https://github.com/DaSushiAsian)
