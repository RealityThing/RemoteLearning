const containsElement = (array, value, obj=false) => {
    return !obj ? array.map(item => item.toString()).indexOf(value) : array.map(item => item[obj].toString()).indexOf(value)
}

module.exports = containsElement;