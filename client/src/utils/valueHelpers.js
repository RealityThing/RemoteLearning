import isEmpty from "./is-empty";

const isObject = val => val instanceof Object
const isArray = val => val instanceof Array
const matchingType = (val, val2) => typeof val === typeof val2

export const areObjectsDifferent = (obj1, obj2, isDif = false) => {

    if (isObject(obj1) && isObject(obj2)) {
    
        for (let key of Object.keys(obj1)) {
    
            if (key in obj2 && !isDif) {

                // check if item is an array
                if (isArray(obj1[key]) && isArray(obj2[key]) && !isDif) {
                    isDif = lookOverArray(obj1[key], obj2[key]);

                // recusrively call check objects to check inner values
                } else if (isObject(obj1[key]) && isObject(obj2[key]) && !isDif) {
                    console.log('recusive call', obj1[key])
                    isDif = areObjectsDifferent(obj1[key], obj2[key]);
                    console.log('recusive call ended', isDif)

                    if (isDif) {
                        console.log(3);
                        return true;
                    };

                // check if values are matching
                } else if (matchingType(obj1[key], obj2[key]) && !isDif) {
                    if (obj1[key] != obj2[key]) {
                        console.log(2)
                        return true;
                    }

                    console.log('same type')
                    
                } else {
                    console.log(4, 'different types')
                    return true;
                }

                if (isDif) {
                    console.log(5)
                    return true;
                }

            } else {
                console.log(6, 'key not in other object')
                return true
            }
        }
    } else {
        return true;
    }
    
    return false;
}

const lookOverArray = (arr, arr2) => {
    console.log('array')

    if (arr.length == arr2.length) {
        let eles = arr.filter((item, i) => {
            if (item != arr2[i]) {

                if (isArray(item) && isArray(arr2[i])) {
                    let isDif = lookOverArray(item, arr2[i]);
                    if (isDif) return item;

                } else if (isObject(item) && isObject(arr2[i])) {
                    console.log('recusive call', item)
                    let isDif = areObjectsDifferent(item, arr2[i]);
                    console.log('recusive call ended', isDif)

                    if (isDif) return item;
                    
                } else {
                    return item;
                }
            }
        })

        return eles.length > 0 ? true : false

    } else {
        return true;
    }
}

export const eachKey = obj => {
    return Object.keys(obj);
}

export const getValueIndexOfArray = (val, key, arr) => {
    return arr.findIndex(ele => ele[key] == val)
}

// let obj1 = {
//     age: 22,
//     name: 'Sami',
//     items: ['laptop', 1, 'item', {
//         name: 'hello',
//         age: 'geg',
//         afge: {
//             fdsfs: '123',
//             fsdf: [
//                 '13',
//                 234234,
//                 ['fds', 213]
//             ]
//         }
//     }, ['fds', '1231']]
// }

// let obj2 = {
//     age: 22,
//     name: 'Sami',
//     items: ['laptop', 1, 'item', {
//         name: 'hello',
//         age: 'geg',
//         afge: {
//             fdsfs: '123',
//             fsdf: [
//                 '13',
//                 234234,
//                 ['fds', 213]
//             ]
//         }
//     }, ['fds', '1231']]
// };

// console.log(areObjectsDifferent(obj1, obj2) ? 'different objects' : 'same objects')
export const getCharNWordsCount = str => {
    if (isEmpty(str)) return false

    str = str.trim()

    let chars = str.length
    let words = str.split(' ').length

    return { chars, words }
}
export default {
    areObjectsDifferent,
    getValueIndexOfArray,
    eachKey,
    getCharNWordsCount
}