const S = require('supertest')
const { expect } = require('chai')
const port = 3000
const factories = require('./factories')
const { PDFDocument } = require('pdf-lib')
const _ = require('lodash')
const pool = require('./browser-pool')
const bodyParser = require('body-parser')


const express = require('express')
const app = express()
app.use(bodyParser.text())

app.post('/', async (req, res) => {
  const browser = pool.get()
  const pdf = await browser.htmlToPdf(req.body)
  res.send(pdf)
})





const isValidPdf = async (buffer) => {
  try {
    await PDFDocument.load(buffer)
  } catch (err) {
    if (err.message.startsWith('Failed to parse PDF document')) {
      return false
    }
    throw err
  }
  return true
}

const initialize = async () => {
  await pool.initialize()
  return app
}

const dispose = async () => {
  return pool.dispose()
}



describe('server', () => {
  let browser
  before(async () => {
    await initialize()
  })

  after(async () => {
    await dispose()
  })

  it('html to pdf', async () => {
    const response = await S(app)
      .post('/')
      .type( 'text' )
      .send(factories.htmlFactory())
      .responseType('blob')
      .expect(200)
    expect(await isValidPdf(response.body))
  })

  it('html to pdf s', async () => {
    expect(factories.htmlFactory(1)).to.not.eql( factories.htmlFactory(2))
    const { body: pdf1 } =  await S(app)
        .post('/')
        .type( 'text' )
        .send(
          factories.htmlFactory(1)
        )
        .responseType('blob')
        .expect(200)

    const { body: pdf2 } =  await S(app)
        .post('/')
        .type( 'text' )
        .send(
          factories.htmlFactory(2)
        )
        .responseType('blob')
        .expect(200)

    expect(await isValidPdf(pdf1)).to.be.true
    expect(await isValidPdf(pdf2)).to.be.true
    expect(Buffer.compare(pdf1, pdf2)).to.not.eql(0)
  })
})
