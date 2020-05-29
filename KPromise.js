class KPromise {
    constructor(handle){
        if(typeof handle !== 'function') {
            throw Error("params must accept a function");
        }
        this.resolvedQueue=[];
        this.rejectQueue=[];
        this.status = "PADDING";
        this.value = undefined;
        handle(this._resolve.bind(this), this._reject.bind(this));
    }
    _resolve(val) {
        this.status = "RESOLVED";
        this.value = val;
        // console.log("_resolve")
        // 执行成功的回调队列
        let run = () => {
            let cb;
            while(cb = this.resolvedQueue.shift()) {
                cb(val);
            }
        }

        // 宏任务
        // setTimeout(run, 0);

        // 微任务
        let ob = new MutationObserver(run); 
        ob.observe(document.body, {
            attributes: true
        })
        document.body.setAttribute("yao", Math.random())

    }
    _reject(val) {
        this.status = "REJECTED";
        this.value = val;
        // console.log("_reject")
        // 执行失败的回调队列
        let run = () => {
            let cb;
            while(cb = this.rejectQueue.shift()) {
                cb(val);
            }
        }

        // 宏任务
        // setTimeout(run, 0);
        // 微任务
        let ob = new MutationObserver(run); 
        ob.observe(document.body, {
            attributes: true
        })
        document.body.setAttribute("yao", Math.random())
    }
    then(onResolved, onRejected) {

        // 缺点 同时执行
        // onResolved && onResolved();
        // onRejected && onRejected();

        // 收集回调；不执行回调
        // this.resolvedQueue.push(onResolved);
        // this.rejectQueue.push(onRejected);

        // 完善写法，添加链式操作
        return new KPromise((reslove, reject) => {
            this.resolvedQueue.push(val => {
                // console.log("val", val)
                val = onResolved && onResolved(val);
                // 返还KPromise对象
                // 判断是否是返还KPromise对象；
                if(val instanceof KPromise) {
                    // 是KPromise 对象；
                    // return val;
                    return val.then(reslove);
                }
                // 普通返回
                reslove(val);
            });

            // this.rejectQueue.push(val => {
            //     onRejected && onRejected();
            // });
            this.rejectQueue.push(val => {
                onRejected && onRejected(val);
                reject(val);
            });
        })
    }
    catch(onRejected) {
        this.then(undefined, onRejected);
    }

    static resolve(val) {
        return new KPromise(resolve => {
            resolve(val);
        })
    }

    static reject(err) {
        return new KPromise((resolve, reject) => {
            reject(err);
        })
    }

    static all(list) {
        return new KPromise((resolve, reject) => {
            let values = [];
            let num = 0;
            for(let i=0; i<list.length; i++){
                num ++;
                list[i].then(res=> {
                    values.push(res);
                    if(num === list.length) {
                        resolve(values);
                    }
                }, err => {
                    reject(err);
                })
            }
        })
    }

    static race(list) {
        return new KPromise((resolve, reject) => {
            // 谁执行快 返回谁的结果
            for(let i=0; i<list.length; i++){
                list[i].then(res => {
                    resolve(res);
                }, err => {
                    reject(err)
                })
            }
        })
    }

    // ECMA2018 add
    finally(cb){
        return this.then(val => cb(val), err => { 
            cb(); 
            // 抛出错误
            throw err;
        })
    }
}