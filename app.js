const currencyOne = document.querySelector('[data-js="currency-one"]')
const currencyTwo = document.querySelector('[data-js="currency-two"]')
const convertedValue = document.querySelector('[data-js="converted-value"]')
const currencyOneTimes = document.querySelector('[data-js="currency-one-times"]')
const feedbackMessage = document.querySelector('[data-js="feedback-message"]')

const apiKey = 'f9bde40008634e49359a1a7d'

const defaultCurrencyBase = 'USD'
const defaultCurrencyTarget = 'BRL'

const showFeedbackMessage = message => feedbackMessage.textContent = message

const getLocalStorage = key => JSON.parse(localStorage.getItem(key))

const setLocalStorage = (key, value) => localStorage.setItem(key, JSON.stringify(value))

const getCurrencyCodesURL = () => 
  `https://v6.exchangerate-api.com/v6/${apiKey}/codes`

const getPairConversionURL = (currencyBase, currencyTarget) => 
  `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${currencyBase}/${currencyTarget}`

const fetchCurrencyCodes = async () => {
  try {
    const currencyCodesURL = getCurrencyCodesURL()
    const response = await fetch(currencyCodesURL)

    const { supported_codes, 'error-type': errorType} = await response.json()

    if (errorType) {
      const errorResponses = {
        'invalid-key': 'Sua chave de API não é válida.',
        'inactive-account': 'Seu endereço de e-mail não foi confirmado.',
        'quota-reached': 'Sua conta atingiu o número de solicitações permitidas pelo seu plano.',
      }

      const message = `${errorType} ${errorResponses[errorType]}`
      throw new Error(message)
    }

    setLocalStorage('currencyCodes', supported_codes)
    return supported_codes

  } catch (error) {
    console.log(error)
    showFeedbackMessage('Falha ao obter códigos suportados')
  }
}

const fetchExchangeRate = async pairConversionURL => {
  try {
    const response = await fetch(pairConversionURL)
    const exchangeRate = await response.json()
    const { 'error-type': errorType } = exchangeRate
    
    if (errorType) {
      const errorResponses = {
        'unsupported-code': 'Não damos suporte ao código da moeda fornecida',
        'malformed-request': 'Alguma parte do seu pedido não segue a estrutura de request.',
        'invalid-key': 'Sua chave da API não é válida.',
        'inactive-account': 'Se enderço de email não foi confirmado.',
        'quota-reached': 'Sua conta atingiu o número máximo de solicitações permitidas pelo plano.'
      }

      const message = `${errorType} ${errorResponses[errorType]}`
      throw new Error(message)
    }

    return exchangeRate

  } catch (error) {
    console.log(error)
    showFeedbackMessage('Falha ao obter taxa de câmbio')
  }
}

const getCurrencyCodes = async () => 
  getLocalStorage('currencyCodes') || fetchCurrencyCodes()
  
const insertOptionIntoSelect = (select, option) => select.append(option)


const createOption = (value, textContent) => {
  const option = document.createElement('option')
  option.value = value
  option.textContent = textContent || value

  return option
}

const setSelectedOption = (select, value) => {
  const options = Array.from(select.children)
  
  options.forEach(option => {
    const isTargetOption = option.value === value

    if (isTargetOption) {
      option.selected = true  
    }
  })
}

const fillSelects = async () => {
  const currencyCodesTemplate = [[defaultCurrencyBase], [defaultCurrencyTarget]]
  const currencyCodes = await getCurrencyCodes() || currencyCodesTemplate

  currencyCodes.forEach(([ currencyCode ]) => {
    insertOptionIntoSelect(currencyOne, createOption(currencyCode))
    insertOptionIntoSelect(currencyTwo, createOption(currencyCode))
  })

  setSelectedOption(currencyOne, defaultCurrencyBase)
  setSelectedOption(currencyTwo, defaultCurrencyTarget)

  updateConversionRate()
}

const getConversionRate = async (currencyBase, currencyTarget) => {
  const pairConversionURL = getPairConversionURL(currencyBase, currencyTarget)
  const { conversion_rate = 0 } = await fetchExchangeRate(pairConversionURL)

  return conversion_rate
}

const showConversionRate = async (currencyBase, currencyTarget, multiplier = 1) => {
  const conversionRate = await getConversionRate(currencyBase, currencyTarget)
  const conversionRateAmount = Number(conversionRate.toFixed(2)) * multiplier

  convertedValue.textContent = conversionRateAmount.toFixed(2)
}

const getSelectedCurrencies = () => { 
  const currencyBase = currencyOne.value
  const currencyTarget = currencyTwo.value

  return [currencyBase, currencyTarget]
}

const updateConversionRate = () => {
  const multiplier = currencyOneTimes.value
  const [ currencyBase, currencyTarget ] = getSelectedCurrencies()

  showConversionRate(currencyBase, currencyTarget, multiplier)
}

window.addEventListener('load', fillSelects)
currencyOneTimes.addEventListener('input', updateConversionRate)
currencyOne.addEventListener('input', updateConversionRate)
currencyTwo.addEventListener('input', updateConversionRate)
