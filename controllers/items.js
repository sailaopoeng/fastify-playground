let items = require('../models/itemModel');

function getLastId() {
    return items.length > 0 ? Math.max(...items.map(item => parseInt(item.id))) : 0;
}

function getNewId() {
    return getLastId() + 1;
}

function resetItems() {
    items = require('../models/itemModel');
}

function getAllItems() {
    return items;
}

function getItemById(id) {
    return items.find(item => item.id === parseInt(id));
}

function findItemPostionById(id) {
    return items.findIndex(item => item.id === parseInt(id));
}

function addItem(itemData) {
    const newItem = {
        id: getNewId(),
        ...itemData
    };
    items.push(newItem);
    return newItem;
}

function updateItem(id, name, description){
    const itemIndex = findItemPostionById(id);
    
    if(itemIndex === -1){
        return null;
    }
    else {
        items[itemIndex].name = name;
        items[itemIndex].description = description;
        return items[itemIndex];
    }
}

function deleteItem(id) {
    const itemIndex = findItemPostionById(id);

    if (itemIndex === -1) {
        return false;
    } else {
        items.splice(itemIndex, 1);
        return true;
    }
}
    
module.exports = { getAllItems, getItemById, addItem, updateItem, deleteItem, resetItems };