const S = require('supertest')
const { expect } = require('chai')
const express = require('express')
const app = express()
const port = 3000
const puppeteer = require('puppeteer')
const factories = require('./factories')
const { PDFDocument } = require('pdf-lib')

app.get('/', (req, res) => res.send('Hello World!'))

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
const htmlToPdf = async (html) => {
  const browser = await puppeteer.launch()
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
  await browser.close()
  return result
}


describe('server', () => {
  it('hello world', async () => {
    const { text } = await S(app).get('/')
    expect(text).eql('Hello World!')
  })

  it('html to pdf', async () => {
    const pdf = await htmlToPdf(factories.htmlFactory())
    expect(isValidPdf(pdf))

  })
})
