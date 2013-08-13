noderest
========

A high-level abstraction for REST APIs build with node.js.

## Usage

Creating new noderest object using factory pattern:

```javascript
var myAPI = Noderest.create({
	version: 1.0,
	basePath: 'api',
	types: ['json'] // only supported now
});
```

Now, we can create a resources:

```javascript
myAPI
	.resource('products')
	// generates resource GET /1.0/products
	.getList(function (params, done) {
		// need a request object? this.req
		// need a response object? this.res
		// need a next callback? this.next

		Products.find({ name: 'Mars' }).limit(params.limit || 10).exec(function (err, docs) {
			done(err, docs);
		});
	})
	// GET /1.0/products/:id
	.get(':id', { id: /^\d+$/ }, function (params, done) {
		Products.findOne({ id: params.id }, function (err, doc) {
			done(err, doc.toJSON());
		});
	})
	.resource('buyers')
	// GET /1.0/products/:id/buyers
	.getList(function (params, done) {
		done(null, null); // returns 204 No Content
	})
	// get back to /1.0/products
	.back('products')
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
```

Register as a middleware:

```javascript
var connect = require('connect'),
    http    = require('http'),
    app     = connect().use(myAPI.middleware());

http.createServer(app).listen(3000);
```
