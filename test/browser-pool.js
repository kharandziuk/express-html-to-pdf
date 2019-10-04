const puppeteer = require('puppeteer')
const { Readable, Writable } = require('stream');

class AsyncTaskQueue {
  constructor(limit = 10) {

    this.queue = new Readable({
      objectMode: true,
      read(size) {}
    })
    this.processor = new Writable({
      objectMode: true,
      highWaterMark: limit + 1,
      write(task, encoding, callback) {
        task().finally(() => callback())
      },
      writev(tasks, callback) {
        Promise.all(tasks.map(({chunk}) => chunk().catch(err => err)))
          .finally(() => callback())
      }
    });
    this.queue.pipe(this.processor)
  }

  addTask(execute) {
    const closure = { resolve: null, reject: null }
    const task = () => execute().then(closure.resolve).catch(closure.reject)
    const promise = new Promise((resolve, reject) => {
      closure.resolve = resolve;
      closure.reject = reject;
    })
    this.queue.push(task)
    return promise
  }
}

const q = new AsyncTaskQueue(1000);

const htmlToPdf = async (browser,  html) => {
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'load' })
  const result = await page.pdf({
    format: 'A4',
    margin: {
      top: '20px',
      left: '20px',
      right: '20px',
      bottom: '20px'
    }
  })
  page.close()
  return result
}


const getBrowserProxy = async () => {
  const browser = await puppeteer.launch()
  return {
    htmlToPdf: async (html) => {
      return q.addTask(() => htmlToPdf(browser, html))
    },
    close: async () => {
      (await browser).close()
    }
  }
}
const delay = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms)
})

const initialize = async (symbol=Symbol.for('resource')) => {
  if (!global.hasOwnProperty(symbol)) {
    global[symbol] = await getBrowserProxy()
  }
}

const dispose = async (symbol=Symbol.for('resource')) => {
  return global[symbol].close()
}

const get = (symbol=Symbol.for('resource')) => {
  if (!global.hasOwnProperty(symbol)) {
    assert('the resoursce should be initialized')
  }
  return global[symbol]
}

module.exports = { get, initialize, dispose }
