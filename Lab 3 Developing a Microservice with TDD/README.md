# Lab - Developing a Microservice with TDD

- [Lab - Developing a Microservice with TDD](#lab---developing-a-microservice-with-tdd)
  - [Description](#description)
    - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Testing with _Jest_](#testing-with-jest)
    - [Writing our first test](#writing-our-first-test)
  - [Mocking objects and methods with Sinon](#mocking-objects-and-methods-with-sinon)
    - [Covering additional requirements, repeating cycle](#covering-additional-requirements-repeating-cycle)
  - [Mocking http call with Nock](#mocking-http-call-with-nock)
  - [Create and run a microservice](#create-and-run-a-microservice)
  - [Conclusions](#conclusions)
  - [Optional activity](#optional-activity)

## Description

In this lab we will explore Test Driven Development (or TDD in short) techniques, by using Node.js and testing library Jest. The focus of this exercise is to create a microservice using test driven development techniques. The base for this service is the shipping service from the "microservices game". The contract is defined in [swagger](https://swagger.io) [specification yaml file](./contract/shipping_service_contract.yaml), and written service should comply with this contract. You can read the [html version of the contract](./contract/shipping_service_contract.html) or use the [swagger editor](https://editor.swagger.io) to ineract with the file.

### Prerequisites

For this lab you need to have:

- Installed Node.js version 8 or later (it comes with `npm`).
- Have access to command-line terminal (git-bash is recommended for windows users).
- Web browser
- IDE, suitable for javascript (VSCode is recommended)

We will use ES6 style javascript, with [async/await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) syntax to handle promises. It requires newer (at least 8) version of Node and preferably some knowledge what [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) is (but not mandatory).

## Setup

  1. For this exercise you should use directory, cloned from your github repository `shipping-service`. Open the terminal, and change the directory to this folder. Then, assuming you already have `node` and `npm` installed, run the following commands:

      ```sh
      npm init -y
      sudo npm i jest -g
      ```

      First command initializes our project by creating `package.json` file with default (or provided) values. It is the core of each javascript application based on npm. If auto-init fails, try running it without `-y` argument, and provide the values.

      Second one installs `jest` testing library globally. And makes `jest` command available.

      Sometimes Jest takes a bit more time to start, than desired. To speed it up, we need to add few lines to the `package.json` file (might be right after "license"):

      ```json
      "jest": {
        "testEnvironment": "node"
      },
      ```

      Latter commands install libraries `axios` (which is used in the main code) and `sinon`, `nock`, which are used only at development/testing time.

## Testing with _Jest_

  1. In our project folder create new folder `tests`, and the first test file inside it: `shipping-controller.test.js`. Using your favourite IDE (VSCode is recommended for javascript) create your empty test suite, using the `describe` syntax:

      ```javascript
      // File tests/shipping-controller.test.js
      describe('Shipping Controller', function() {
          // Test cases will go here
          it('Canary test', () => {})
      })
      ```

      We also have added one empty test, using `it()`, because _Jest_ test suite should have at least one test.

  2. Now let's run all tests in our folder:

      ```sh
      jest tests --watch
      ```

      Here second argument `tests` directs to the folder, where the test files are stored. Option `--watch` tells jest to not exit after run, and keep looking for further test file changes. When changes are found, tests are re-run. This enables 'testing on the fly', which is pretty handy in TDD.

      After running our empty test suite with an empty test, we get result:

      ```text
       PASS  tests/shipping-controller.test.js
      Shipping Controller
        ✓ Canary test

      Test Suites: 1 passed, 1 total
      Tests:       1 passed, 1 total
      Snapshots:   0 total
      Time:        0.094s, estimated 1s
      ```

      Results are correct, since we don't have any real test cases yet, just an empty test with zero failures.
  
  3. Let's push the code into code repository. You should have github.com account for that, and have repository `shipping-service` already created in there. Since your current folder is cloned from github, just type the following commands in terminal:

        ```shell
        git add tests package.json
        git commit -m "initial commit"
        git push
        ```

        Validate in browser that all files are uploaded successfully.

### Writing our first test

  1. Let's create our first test case. For that we take business requirements from shipping service of microservices game. This service should return shipping price for the individual item by given product id. Service uses three other services to calculate that. So, lets define an empty method, in the shipping controller, called `getItemShipping`. Open your favourite text editor, and in the `src/controllers` folder create file, named `shipping-controller.js` with contents:

      ```javascript
      // src/controllers/shipping-controller.js
      class ShippingController{

        constructor() {}

        getItemShipping(item) {}

      }

      module.exports = ShippingController
      ```

  2. Since now we have our empty controller, with visible contract, we can write first test, and expect some results from it: Create the file shipping-controller.test.js in the tests folder and paste below code in to it:

      ```javascript
      // tests/shipping-controller.test.js
      var ShippingController = require('../src/controllers/shipping-controller')

      describe('Shipping controller', function () {
        var shippingCtrl = new ShippingController()

        it('Should calculate correct shipping ', async function () {
          let shipping = await shippingCtrl.getItemShipping({ id: 1, type: 'standard' })
          expect(shipping).toBe(0.5)
        })

      })
      ```

      We have created shipping controller object `shippingCtrl`. The test itself asynchronously called method `getItemShipping`, and expected result of `0.5`. For now it makes no sense, since code and test does not know initial data, which should be provided by product service. For this test to work we need to implement logic in the controller method, and mock the data.

      If you run the `jest tests` command the tests will fail. That's expected

## Mocking objects and methods with Sinon

  7. For mocking we will use `sinon` library. To install it, in command line run:

      ```sh
      npm i sinon --save-dev
      ```

      And in the code, you need to require sinon object:

      ```javascript
      var sinon = require('sinon')
      ```

  8. Sinon's purpose is to mock, or in other words, replace actual implementations of objects or functions, with the ones we need for the test. Lets write some logic in our controller, and find out the candidate for mocking:

      ```javascript
      // src/controllers/shipping-controller.js
      var productService = require('../services/product-service')

      class ShippingController {

        constructor() {
          this.REGULAR_PRICE = 0.1
          this.OVERNIGHT_PRICE = 1
        }

        async getItemShipping(item) {
          var shippingAmount = await productService.getProductWeight(item.id)
          return shippingAmount * this.REGULAR_PRICE
        }

      }

      module.exports = ShippingController;
      ```

  9. From the code it is visible, that we are using `productService` to get the item weight. But we don't have it. Also, it is not our test subject. So we need to separate it from our test by replacing its implementation with the mock version. For that we still need to have the object itself, so in the `src/services` folder we will create empty module with one method:

      ```javascript
      // src/services/product-service.js
      module.exports = {
          getProductWeight: async function(productId) {
            // Meanwhile it can be implemented by other developers
          }
      }
      ```

  10.  Then, we can mock it with `sinon.stub()` method in our test:

        ```javascript
        /* tests/shipping-controller.test.js */
        var sinon = require('sinon')
        var ShippingController = require('../src/controllers/shipping-controller')
        var productService = require('../src/services/product-service')

        describe('Shipping controller', function () {
          var shippingCtrl = new ShippingController()

          beforeEach(function(){
            sinon.stub(productService, 'getProductWeight').callsFake(async function() {
              return new Promise(function (resolve, reject) {
                setTimeout(() => {
                  resolve(5)
                }, 50)
              })
            })
          })

          afterEach(function () {
            productService.getProductWeight.restore()
          })

          it('Should calculate correct shipping ', async function () {
            let shipping = await shippingCtrl.getItemShipping({ id: 1, type: 'standard' })
            expect(shipping).toBe(0.5)
          })

        })
        ```

        `sinon.stub` method takes object to work on, and method name to mock. `callsFake` takes a function, which is a replacement of the original one.
        Our mock implementation returns `Promise` object and resolves it after 50 milliseconds with the value of `0.5`. The test now passes, since it gets required data from product service, and returns expected result for regular shipping type.

### Covering additional requirements, repeating cycle

  11. Even though our test passes now, it does not cover all the requirements, since there are two types of shipment, and they are priced differently. We will write additional test case to cover overnight shipment.
  
        ```javascript
        // part of tests/shipping-controller.test.js
        it('Should calculate correct overnight shipping ', async function () {
            let shipping = await shippingCtrl.getItemShipping({ id: 1, type: 'overnight' })
            expect(shipping).toBe(5)
        })
        ```

        The test reflects valid business requirement, but it fails again:

        ```text
        FAIL  tests/shipping-controller.test.js
          Shipping controller
            ✓ Should calculate correct shipping  (69ms)
            ✕ Should calculate correct overnight shipping  (70ms)

          ● Shipping controller › Should calculate correct overnight shipping

          expect(received).toBe(expected) // Object.is equality

          Expected: 5
          Received: 0.5

          ...

          Test Suites: 1 failed, 1 total
          Tests:       1 failed, 1 passed, 2 total
        ```

  12. We are mocking the same result from the `productService`, but the `type` of the item is passed different, so the calculations must reflect that. Let’s alter implementation, to make this test happy: replace the existing `async getItemShipping(item)` function in the controller with below code

        ```javascript
        // part of src/controllers/shipping-controller.js
        async getItemShipping(item) {
          var shippingAmount = await productService.getProductWeight(item.id)
          if (item.type.toLowerCase() === 'overnight') {
            return shippingAmount * this.OVERNIGHT_PRICE
          } else {
            return shippingAmount * this.REGULAR_PRICE
          }
        }
        ```

        Implementation now calculates different prices per requirement, and both tests are passing.

        ```text
        PASS  tests/shipping-controller.test.js
        Shipping controller
          ✓ Should calculate correct shipping  (65ms)
          ✓ Should calculate correct overnight shipping  (55ms)
        ```

## Mocking http call with Nock

  13. Let's assume we need to implemented `productService` ourselves. We know, that it has method `getProductWeight`, and it should asynchronously return weight by the given product id. Lets write dedicated `product-service.test.js` to cover that:

      ```javascript
      // tests/product-service.test.js
      var productService = require('../src/services/product-service')

      describe('Product service', function () {

        it('Should call http endpoint', async function () {
          let weight = await productService.getProductWeight('13')
          expect(weight).toBe(15.5)
        })
      })
      ```

      After running `jest tests` we can see, that now there are two test suites, and three tests, and the new one is failing.

      ```text
       PASS  tests/shipping-controller.test.js
       FAIL  tests/product-service.test.js
      ● Product service › Should call http endpoint

      expect(received).toBe(expected) // Object.is equality

      Expected: 15.5
      Received: undefined

      Difference:

        Comparing two different types of values. Expected number but received undefined.
      ```

  14. In this case, we have a method, which does only the http request. We want to make sure, that the call was made with the correct url, and response parsed properly. For that we need to mock internal http request call of node.js. We can do this by using `nock` library, which is created exactly for this purpose. Let's install it:

      ```sh
      npm i nock --save-dev
      ```

  15. Now include it in the top of our new test file, and add the the mocking itself to the specific test case by replacing the existing code with the below one

      ```javascript
      /**
      * @jest-environment node
      */
      var productService = require('../src/services/product-service')
      var nock = require('nock')

      describe('Product service', function () {
        it('Should call remote service', async function () {
          nock('https://product.service:8899/products')
            .get('/13')
            .delayBody(10)
            .reply(200, {
              weightLB: 15.5,
              unit: 'lbs'
            })

          let weight = await productService.getProductWeight('13')
          expect(weight).toBe(15.5)
        })
      })
      ```

      Notice the special comment at the beginning of the test, it helps Jest handle mocked requests.

  16. After this call `nock` takes over the request, and returns our provided object (after delaying for a few milliseconds). The test still fails, because we don't have actual implementation yet, and nobody calls it. Let’s create it by running below command and replace the code in `product-service.js` with below

      ```sh
      npm i axios --save
      ```

      ```javascript
      // src/services/product-service.js
      var axios = require('axios')

      module.exports = {
        getProductWeight: async function (productId) {
          return axios
            .get('https://product.service:8899/products/' + productId)
            .then(response => {
              return response.data.weightLB
            })
        }
      }
      ```

      It uses popular `axios` library to make HTTP request and return `Promise` object, which is handled later in the `shipping-controller`. In the `axios.get` method, `nock` takes over the http call part, and returns mocked data. Method `getProductWeight` runs with no alterations, and result is compared to our expectations.

  17. Our test now passes. But what about the cases, when the result from service is not correct? Let's write one more test case in the `tests/product-service.test.js` for it. Place the code in the file before the last `})`

      ```javascript
      it('Should handle unexpected response structure', async function () {
        nock('https://product.service:8899/products')
            .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
            .get('/19')
            .reply(200, {
              res: 15.5
            })

        await productService
            .getProductWeight('19')
            .then(() => {
              throw(new Error('Should not resolve in case of malformed data'))
            })
            .catch(err => {
              expect(err.message).toBe('Invalid response object')
            })
        })
      ```

  18. This test expects the call to `getProductWeight` to return rejected promise, when the returned data structure is not correct (cannot parse actual weight property). Test should fail, if method resolves with `undefined` or any other result after that. Our tests are failing again. Let's improve implementation:

      ```javascript
      // src/services/product-service.js
      var axios = require('axios')

      module.exports = {
        getProductWeight: async function (productId) {
          return axios
            .get('https://product.service:8899/products/' + productId)
            .then(response => {
              if (response.data && !Number.isNaN(parseFloat(response.data.weightLB))) {
                return response.data.weightLB
              } else {
                return Promise.reject('Invalid response object')
              }
            })
            .catch( (err) => {
              throw new Error(err)
            })
        }
      }
      ```

      Additional check handles the case with malformed data, and tests are passing again!

## Create and run a microservice

  19. Our created and tested code is not a running microservice. In order our functional modules to become a service, we need to expose them as one. Probably the most popular library for this task is **express.js**. Let's install it and see, how much effort it takes. In the terminal, install the latest express and save it as dependency:

      ```npm
      npm i express --save
      ```

  20. After installing express package, we need to create an entry point of the web service. Usually, entry file is named `app.js`, `index.js` and similar. In `src` folder, create one more file, called `app.js`:

      ```javascript
      // contents of src/app.js
      const express = require('express')
      const app = express()

      app.get('/*shipping', (request, response) => {
        response.send('It works!')
      })

      app.listen(3000, () => console.log('ShippingService is listening on port 3000'))
      ```

      It is the one of the shortest possible services with express. You can run it by typing:

      ```sh
      node src/app.js
      ```

      and it will report, that:

      ```sh
      ShippingService is listening on port 3000
      ```

      In the browser, by opening [http://localhost:3000/shipping](http://localhost:3000/shipping) you will see, that service is working. Just not much is done yet.

  21. Let's add some flesh on this skeleton. Our service should respond to HTTP GET requests with given arguments of `itemId` and shipping `type`. Let's modify the header to extract those path parameters.

      ```js
      app.get('/*shipping', (request, response) => {
      ```

  22. those parameters will be stored in `request.params` array variable. Our implementation logic is in the module `shipping-controller.js`. We should require it, and use its methods to generate response.

      ```js
      // src/app.js
      const express = require('express')
      const app = express()
      const ShippingController = require('../src/controllers/shipping-controller')

      app.get('/*shipping', (request, response) => {
        let ctrl = new ShippingController()

        ctrl
          .getItemShipping({id: request.query.itemId, type: request.query.type})
          .then(amount => {
            response.send({ itemId: request.query.itemId, priceUSD: amount })
          })

      })

      app.listen(3000, () => console.log('ShippingService is listening on port 3000'))
      ```

  23. Here our app includes `ShippingController`, creates it's instance, and calls `getItemShipping` method with given request parameters. It should work, at least in very optimistic scenario. But services sometimes fail, errors happen. In our case, we call one external service (from `product-service`), and have no error handling for the failures. Lets add some general error handling on the main method to deal with possible errors in the `app.js`:

      ```js
      .catch(error => {
        response.status(500).send({ error: error.message })
      })
      ```

      Please refer to the step 27 for the exact code placement
  
  24. If you have tried to run the code at this point, you will notice, that there is an error, which prevents service from returning actual result. It is connected with the factor No. 3 from the [12 factor app](https://12factor.net/), which is called "Config". It requires to store configuration in the environment. In real world application, we should create, or even better - use some existing library to manage our configuration between environments. But to keep things simple, here we will just use few environment variables for the main options: application port and product service url. This will require some minor changes. In the `app.js` we use `process.env.PORT` variable to override default service port:

      ```js
      let PORT = process.env.PORT || 3001;
      app.listen(PORT, () => console.log(`ShippingService is listening on port ${PORT}`))
      ```

  25. In `product-service.js` we will start using environment-provided `MICROS_PRODUCTS_URL` variable for products microservice. It uses default value, in case environment variable is not set:

      ```js
      let URL = process.env.MICROS_PRODUCTS_URL || 'product.service:8899/products';
      return axios
        .get(`https://${URL}/${productId}`)
      ```

      Please refer to the step 27 for the exact code placement

  26. When running application locally, we just set environment variable in the same shell as the app will be run, or in, for example, debug config. Environment variables locally are set like this:

      ```bash
        export MICROS_PRODUCTS_URL=product-service-java.eu-gb.mybluemix.net/products
      ```

      **!NB**: Windows users should be able to set an environment variable in one of the following ways for **cmd**:

      ```sh
      set MICROS_PRODUCTS_URL=product-service-java.eu-gb.mybluemix.net/products
      ```

      for Power Shell (not tested):

      ```sh
      [Environment]::SetEnvironmentVariable("MICROS_PRODUCTS_URL","product-service-java.eu-gb.mybluemix.net/products")
      ```

  27. With correct environment setup you can make your service to use any external service you require.

      Full source for `app.js`:

      ```js
      // contents of src/app.js
      const express = require('express')
      const app = express()
      const ShippingController = require('../src/controllers/shipping-controller')

      app.get('/*shipping', (request, response) => {
        let ctrl = new ShippingController()

        ctrl
          .getItemShipping({id: request.query.itemId, type: request.query.type})
          .then(amount => {
            response.send({ itemId: request.query.itemId, amount: amount })
          })
          .catch(error => {
            response.status(500).send({ error: error.message })
          })
      })
      let PORT = process.env.PORT || 3001;
      app.listen(PORT, () => console.log(`ShippingService is listening on port ${PORT}`))
      ```

      And `product-service.js`:

      ```js
      // src/services/product-service.js
      var axios = require('axios')

      module.exports = {
        getProductWeight: async function (productId) {
          let URL = process.env['MICROS_PRODUCTS_URL'] || 'product.service:8899/products';
          return axios
            .get(`https://${URL}/${productId}`)
            .then(response => {
              if (response.data && !Number.isNaN(parseFloat(response.data.weightLB))) {
                return response.data.weightLB
              } else {
                return Promise.reject('Invalid response object')
              }
            })
            .catch( (err) => {
              throw new Error(err)
            })
        }
      }
      ```

      That's it! You can test your service by running it using the command `node src/app.js` and then invoking the call at [http://localhost:3001/shipping?itemId=AAA&type=regular](http://localhost:3001/shipping?itemId=AAA&type=regular). You should see something similar to:

      ```json
      {"itemId":"AAA","amount":0.5}
      ```

      Our code became a runnable microservice. For real-world application it still needs a lot of work, like correct, separated structure, proper routing, security, logging, error handling, etc. But nonetheless it works, has minimal configuration, and can be prepared for deployment to the cloud.

## Conclusions

 After this exercise you should understand the main TDD cycle: test, fail, implement, repeat. Also, this hands-on exercise demonstrated the tools, currently used to test Node.JS applications.

 Also, we made a minimal working microservice application, which can be prepared for the cloud deployment.

## Optional activity

As you have noticed, shipping service depends on a third party product service running somewhere in cloud and we would like to write our own instance of it.

There is a [service interface definition](./contract/product_service_contract.yaml) in Swagger format which will serve a reference for your instance of product service. You can view it in [online swagger editor](https://editor.swagger.io/)

Please create a new github repository for product-service (we know by now that each microservice should has its own repository and therefore life cycle) and use TDD approach to create the microservice.

You can also take a look at Java version of this lab [https://github.ibm.com/cloudappdev/CloudNativeBootcamp/tree/80f74e3adc9330476f691860293b9732e2c1cff4/11%20-%20Lab%202%20TDD/java](https://github.ibm.com/cloudappdev/CloudNativeBootcamp/tree/80f74e3adc9330476f691860293b9732e2c1cff4/11%20-%20Lab%202%20TDD/java)
