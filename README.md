noderest
========

A high-level abstraction for REST APIs build with node.js.

## Usage

Creating new noderest object using factory pattern:

```javascript
var nodereset = require('noderest');

var api = noderest({
	version: 1.0,
	basePath: 'api'
});
```

Now, we can create a resources:

```javascript
api
	.resource('products')
	// generates resource GET /1.0/products
	.all(function (params, done) {
		// need a request object? this.req
		// need a response object? this.res
		// need a next callback? this.next

		Products.find({ name: 'Mars' }).limit(params.limit || 10).exec(function (err, docs) {
			done(err, docs.map(function (d) { d.toJSON() }));
		});
	})
	// GET /1.0/products/:id
	.get(':id', { id: /^\d+$/ }, function (params, done) {
		Products.findOne({ id: params.id }, function (err, doc) {
			done(err, doc.toJSON());
		});
	})
	// get back to /1.0/products
	.end()
	// POST /1.0/products
	.save(function (data, params, done) {
		Products.create(data, function (err, product) {
			done(err, product.toJSON());
		});
	})
	// PUT /1.0/products/:id
	.update(':id', { id: /^\d+$/ }, function (data, params, done) {
		Producer.findAndUpdate(...);
	});
	.resource('buyers')
	// GET /1.0/products/:id/buyers
	.all(function (params, done) {
		done(null, []);
	});
```

Register as a middleware:

```javascript
var connect = require('connect'),
    http    = require('http'),
    app     = connect().use(noderest.middleware(api));

http.createServer(app).listen(3000);
```
