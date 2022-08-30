/*eslint-env mocha*/
/*global chai*/

function testSelector(nodes, nodeDict) {
	var nodeList = {};

	// iterate through nodes list to construct a tree of parent and child nodes
	for (var attr = 0; attr < nodes.length; attr++) {
		// if element type, create element node with corresponding tagname
		if (nodes[attr].type === "element") {
			var node = document.createElement(nodes[attr].tagname);

			// add ID if exists
			if (nodes[attr].id) {
				node.id = nodes[attr].id;
			}

			// add class if exists
			if (nodes[attr].className) {
				node.className = nodes[attr].className;
			}
		}

		// if text type, create text node with buffer text
		else if (nodes[attr].type === "text") {
			var node = document.createTextNode("text");
		}

		// otherwise node is null
		else {
			var node = null;
		}

		// add created node object to nodeList
		nodeList[attr] = node;

		// if not the first node in the list, not null,
		// and preceding node not null, set this node's child to preceding node
		if (attr > 0 && nodeList[attr] !== null && nodeList[attr - 1] !== null) {
			nodeList[attr].appendChild(nodeList[attr - 1]);
		}
	}

	// first node in nodeList is lowest tier child, so find its selector
	return BOOMR.utils.makeSelector(nodeList[0]);
}

describe("BOOMR.utils.makeSelector", function() {
	var assert = chai.assert;

	it("single node with ID", function() {
		var nodes = [
			{"type": "element", "tagname": "div", "id": "test"}
		];

		var selector = testSelector(nodes);
		assert.deepEqual("div#test", selector);
	});

	it("node with class and parent with ID", function() {
		var nodes = [
			{"type": "element", "tagname": "div", "className": "test"},
			{"type": "element", "tagname": "div", "id": "yum"}
		];

		var selector = testSelector(nodes);
		assert.deepEqual("div#yum div.test", selector);
	});

	it("node with class and parent with class and ID", function() {
		var nodes = [
			{"type": "element", "tagname": "div", "className": "test"},
			{"type": "element", "tagname": "div", "className": "test2", "id": "yum"}
		];

		var selector = testSelector(nodes);
		assert.deepEqual("div#yum div.test", selector);
	});

	it("node with class and parent with class", function() {
		var nodes = [
			{"type": "element", "tagname": "div", "className": "test"},
			{"type": "element", "tagname": "img", "className": "test2"}
		];

		var selector = testSelector(nodes);
		assert.deepEqual("img.test2 div.test", selector);
	});

	it("check three nodes, stops at first ID when more parents exist", function() {
		var nodes = [
			{"type": "element", "tagname": "ul", "className": "test"},
			{"type": "element", "tagname": "img", "className": "test2"},
			{"type": "element", "tagname": "div", "id": "test3"},
			{"type": "element", "tagname": "ul", "className": "test"}
		];

		var selector = testSelector(nodes);
		assert.deepEqual("div#test3 img.test2 ul.test", selector);
	});

	it("check four nodes", function() {
		var nodes = [
			{"type": "element", "tagname": "ul", "className": "test"},
			{"type": "element", "tagname": "img", "className": "test2"},
			{"type": "element", "tagname": "div", "className": "test3"},
			{"type": "element", "tagname": "ul", "id": "id4"},
			{"type": "element", "tagname": "div", "className": "test5", "id": "nextID"}
		];

		var selector = testSelector(nodes);
		assert.deepEqual("ul#id4 div.test3 img.test2 ul.test", selector);
	});

	it("check five nodes, check asterick, check textNode", function() {
		var nodes = [
			{"type": "text"},
			{"type": "element", "tagname": "ul", "className": "test"},
			{"type": "element", "tagname": "img", "className": "test2"},
			{"type": "element", "tagname": "div", "className": "test3"},
			{"type": "element", "tagname": "ul", "className": "test4"},
			{"type": "element", "tagname": "span", "id": "id5"},
			{"type": "element", "tagname": "div", "className": "test5", "id": "nextID"}
		];

		var selector = testSelector(nodes);
		assert.deepEqual("span#id5 * div.test3 img.test2 ul.test", selector);
	});

	it("check asterick with > 5 nodes, check no ID or class", function() {
		var nodes = [
			{"type": "element", "tagname": "span"},
			{"type": "element", "tagname": "ul", "className": "test"},
			{"type": "element", "tagname": "img", "className": "test2"},
			{"type": "element", "tagname": "div"},
			{"type": "element", "tagname": "ul", "className": "test4"},
			{"type": "element", "tagname": "span"},
			{"type": "element", "tagname": "div", "className": "test5", "id": "nextID"}
		];

		var selector = testSelector(nodes);
		assert.deepEqual("div#nextID * img.test2 ul.test span", selector);
	});

	it("same as above but final node no ID", function() {
		var nodes = [
			{"type": "element", "tagname": "span"},
			{"type": "element", "tagname": "ul", "className": "test"},
			{"type": "element", "tagname": "img", "className": "test2"},
			{"type": "element", "tagname": "div"},
			{"type": "element", "tagname": "ul", "className": "test4"},
			{"type": "element", "tagname": "span"},
			{"type": "element", "tagname": "div", "className": "test5"}
		];

		var selector = testSelector(nodes);
		assert.deepEqual("div.test5 * img.test2 ul.test span", selector);
	});

	it("same as above but ends at BODY", function() {
		var nodes = [
			{"type": "element", "tagname": "span"},
			{"type": "element", "tagname": "ul", "className": "test"},
			{"type": "element", "tagname": "img", "className": "test2"},
			{"type": "element", "tagname": "div"},
			{"type": "element", "tagname": "ul", "className": "test4"},
			{"type": "element", "tagname": "span"},
			{"type": "element", "tagname": "body"}
		];

		var selector = testSelector(nodes);
		assert.deepEqual("span * img.test2 ul.test span", selector);
	});

	it("same as above but ends at BODY as 5th parent", function() {
		var nodes = [
			{"type": "element", "tagname": "span"},
			{"type": "element", "tagname": "ul", "className": "test"},
			{"type": "element", "tagname": "img", "className": "test2"},
			{"type": "element", "tagname": "div"},
			{"type": "element", "tagname": "ul", "className": "test4"},
			{"type": "element", "tagname": "body"}
		];

		var selector = testSelector(nodes);
		assert.deepEqual("ul.test4 * img.test2 ul.test span", selector);
	});

	it("same as above but ends at BODY as 4th parent", function() {
		var nodes = [
			{"type": "element", "tagname": "span"},
			{"type": "element", "tagname": "ul", "className": "test"},
			{"type": "element", "tagname": "img", "className": "test2"},
			{"type": "element", "tagname": "div"},
			{"type": "element", "tagname": "body"}
		];

		var selector = testSelector(nodes);
		assert.deepEqual("div img.test2 ul.test span", selector);
	});

	it("same as above but ends at BODY as 3rd parent", function() {
		var nodes = [
			{"type": "element", "tagname": "span"},
			{"type": "element", "tagname": "ul", "className": "test"},
			{"type": "element", "tagname": "img", "className": "test2"},
			{"type": "element", "tagname": "body"}
		];

		var selector = testSelector(nodes);
		assert.deepEqual("img.test2 ul.test span", selector);
	});

	it("check null in middle", function() {
		var nodes = [
			{"type": "element", "tagname": "span"},
			{"type": "element", "tagname": "ul", "className": "test"},
			{"type": "element", "tagname": "img", "className": "test2"},
			{"type": "element", "tagname": "div"},
			{},
			{"type": "element", "tagname": "ul", "className": "test4"},
			{"type": "element", "tagname": "span"},
			{"type": "element", "tagname": "div", "className": "test5"}
		];

		var selector = testSelector(nodes);
		assert.deepEqual("div img.test2 ul.test span", selector);
	});

	it("check body", function() {
		var nodes = [
			{"type": "element", "tagname": "span"},
			{"type": "element", "tagname": "ul", "className": "test"},
			{"type": "element", "tagname": "img", "className": "test2"},
			{"type": "element", "tagname": "div"},
			{"type": "element", "tagname": "ul", "className": "test4"},
			{"type": "element", "tagname": "span"},
			{"type": "element", "tagname": "body"}
		];

		var selector = testSelector(nodes);
		assert.deepEqual("span * img.test2 ul.test span", selector);
	});

	it("check single textNode", function() {
		var nodes = [
			{"type": "text", "tagname": "span"},
			{"type": "element", "tagname": "body"}
		];

		var selector = testSelector(nodes);
		assert.deepEqual("", selector);
	});
});
