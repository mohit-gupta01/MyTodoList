const express = require('express');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const date = require(__dirname + '/date.js');

// let items = ['Buy Food', 'Cook Food', 'Eat Food'];
// let workItems = [];

const app = express();
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({ name: "Welcome To Todolist!" });
const item2 = new Item({ name: "Hit + to add a new item." });

const defaultItems = [item1, item2];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get('/', function (req, res) {
    // let day = date.getDate();
    Item.find()
        .then(items => {
            if (items.length === 0) {
                Item.insertMany(defaultItems)
                    .then(res => {
                        console.log(res);
                    })
                    .catch(err => {
                        console.log(err);
                    });
                res.redirect('/');
            } else {
                res.render("list", { listTitle: "Today", listItem: items });
            }
        })
        .catch(err => {
            console.log(err);
        });
});

app.get("/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({ name: customListName })
        .then(foundList => {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect('/' + customListName);
            }
            else {
                res.render("list", { listTitle: foundList.name, listItem: foundList.items });
            }
        })
        .catch(err => {
            console.log(err);
        });
});

app.post('/', (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const newItem = new Item({
        name: itemName
    });

    if (listName === "Today") {
        newItem.save();
        res.redirect('/');
    }
    else{
        List.findOne({name: listName})
        .then(foundList=>{
            foundList.items.push(newItem);
            foundList.save();
            res.redirect('/' + listName);
        })
        .catch(err=>{
            console.log(err);
        });
    }
});

app.post('/delete', (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if(listName === "Today"){
        Item.deleteOne({ _id: checkedItemId })
            .then(message => {
                console.log(message);
                res.redirect('/');
            })
            .catch(err => {
                console.log(err);
            });
    }
    else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
        .then(message=>{
            console.log(message);
            res.redirect('/' + listName);
        })
        .catch(err=>{
            console.log(err);
        });
    }
});


app.listen(3000, function () {
    console.log("Server started on port 3000");
});