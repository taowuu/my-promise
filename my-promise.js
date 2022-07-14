var panding = 'panding'
var fulfilled = 'fulfilled'
var rejected = 'rejected'

// 处理 x
function resolvePromise(promise2, x, resolve, reject) {
  // 循环链
  if(promise2 === x) {
    return reject(new TypeError('chaining cycle'))
  }
  // 判断是 Promise
  var called = false
  if((typeof x === 'object' && x !== null) || typeof x === 'function') {
    // 取 then 异常
    try {
      var then = x.then
      if(typeof then === 'function') {
        then.call(x, (y) => {
          // 避免重复调用
          if(called) return
          called = true
          // 递归调用
          resolvePromise(promise2, y, resolve, reject)
        }, (r) => {
          if(called) return
          called = true
          reject(r)
        })
      } else {
        // 返回对象
        resolve(x)
      }
    } catch(e) {
      if(called) return
      called = true
      reject(e)
    }
  } else {
    // 返回普通值
    resolve(x)
  }
}

class MyPromise {
  // 属性初始化
  constructor(executor) {
    this.status = panding
    this.value = undefined
    this.reason = undefined
    // 异步函数处理
    this.onFulfilledCallbacks = []
    this.onRejectedCallbacks = []
    // 成功
    var resolve = (value) => {
      if(this.status === panding) {
        this.status = fulfilled
        this.value = value
        // 异步发布
        this.onFulfilledCallbacks.forEach(fn => fn())
      }
    }
    // 失败
    var reject = (reason) => {
      if(this.status === panding) {
        this.status = rejected
        this.reason = reason
        // 异步发布
        this.onRejectedCallbacks.forEach(fn => fn())
      }
    }
    // 异常
    try {
      executor(resolve, reject)
    } catch(e) {
      reject(e)
    }
  }
  // then 实现
  then(onFulfilled, onRejected) {
    // 处理 then 空值
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled: value => value
    onRejected = typeof onRejected === 'function' ? onRejected: reason => {throw reason}
    var promise2 = new MyPromise((resolve, reject) => {
      if(this.status === fulfilled) {
        // 处理异常
        // 保证拿到 promise2
        setTimeout(() => {
          try {
            var x = onFulfilled(this.value)
            resolvePromise(promise2, x, resolve, reject)
          } catch(e) {
            reject(e)
          }
        }, 0)
      }
      if(this.status === rejected) {
        setTimeout(() => {
          try {
            var x = onRejected(this.reason)
            resolvePromise(promise2, x, resolve, reject)
          } catch(e) {
            reject(e)
          }
        }, 0)
      }
      // 异步函数订阅
      if(this.status === panding) {
        this.onFulfilledCallbacks.push(() => {
          try {
            var x = onFulfilled(this.value)
            resolvePromise(promise2, x, resolve, reject)
          } catch(e) {
            reject(e)
          }
        })
        this.onRejectedCallbacks.push(() => {
          try {
            var x = onRejected(this.reason)
            resolvePromise(promise2, x, resolve, reject)
          } catch(e) {
            reject(e)
          }        
        })
      }
    })
    return promise2
  }
  // catch 实现
  catch(errorCallback) {
    return this.then(null, errorCallback)
  }
}

var test = function() {
  // 一般情况测试
  // var p = new MyPromise((resolve, reject) => {
  //   resolve('success')
  //   reject('fail')
  //   throw new Error('Error')
  //   setTimeout(() => {
  //     resolve('success')
  //   }, 2000)
  // })
  // 顺序调用测试
  // p.then((value) => {
  //   console.log('fulfilled1: ' + value)
  // }, (reason) => {
  //   console.log('rejected1: ' + reason)
  // })
  // p.then((value) => {
  //   console.log('fulfilled2: ' + value)
  // }, (reason) => {
  //   console.log('rejected2: ' + reason)
  // })
  // 链式调用测试
  var p1 = new MyPromise((resolve, reject) => {
    resolve('p1')
    // reject('err')
  })
  var p2 = p1.then(() => {
    // 循环链异常测试
    // return p2
    // 递归调用测试
    return new MyPromise((resolve, reject) => {    
      setTimeout(() => {
        resolve(new MyPromise((resolve, reject) => {
          resolve('new promise resolve')
        }))
      }, 1000)  
    })
    // return new Error('err')
  }, (reason) => {
    return reason
  })
  p2.then().then((value) => {
    // console.log(value)
    // catch 实现测试
    throw Error('error')
  }, (reason) => {
    console.log(reason)
  })
  .catch((e) => {
    console.log(e)
  })
}

test()