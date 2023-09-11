global.fetch = require('jest-fetch-mock')

console.error = () => undefined

class FormDataMock {
  formData = {}
  append(name: string, value: object) {
    Object.assign(this.formData, { [name]: value })
  }
}

// @ts-expect-error only implement necessary functions
global.FormData = FormDataMock
