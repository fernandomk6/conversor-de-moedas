const currencyOne = document.querySelector('[data-js="currency-one"]')
const currencyTwo = document.querySelector('[data-js="currency-two"]')
const convertedValue = document.querySelector('[data-js="converted-value"]')
const currencyOneTimes = document.querySelector('[data-js="currency-one-times"]')
const feedbackMessage = document.querySelector('[data-js="feedback-message"]')
const conversionPrecision = document.querySelector('[data-js="conversion-precision"]')

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

    if (!response.ok) throw new Error('Falha na conexão ao tentar obter os códigos das moedas') 

    const { supported_codes, 'error-type': errorType } = await response.json()

    if (errorType) throw new Error(errorType)
    
    setLocalStorage('currencyCodes', supported_codes)
    
    return supported_codes

  } catch ({ message }) {
    console.log(message)
    showFeedbackMessage('Falha ao obter códigos das moedas suportadas')
  }
}

const fetchExchangeRate = async pairConversionURL => {
  try {
    const response = await fetch(pairConversionURL)

    if (!response.ok) throw new Error('Falha na conexão ao tentar obter a taxa de câmbio') 

    const exchangeRate = await response.json()
    const { 'error-type': errorType } = exchangeRate
    
    if (errorType) throw new Error(errorType)

    return exchangeRate

  } catch ({ message }) {
    console.log(message)
    showFeedbackMessage('Não foi possível obter a taxa de câmbio das moedas selecionadas')
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

  const checkIfOptionShouldBeSelected = option => {
    const isTargetOption = option.value === value
    if (!isTargetOption) return
    option.selected = true
  }
  
  options.forEach(checkIfOptionShouldBeSelected)
}

const fillSelects = async () => {
  const currencyCodesTemplate = [[ defaultCurrencyBase ], [ defaultCurrencyTarget ]]
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

const showConversionRate = async (currencyBase, currencyTarget, multiplier) => {
  const conversionRate = await getConversionRate(currencyBase, currencyTarget)
  const conversionRateAmount = Number(conversionRate) * multiplier
  const conversionPrecisionAmount = Number(conversionRate) * 1
  
  convertedValue.textContent = conversionRateAmount.toFixed(2)
  conversionPrecision.textContent = `1 ${currencyBase} = ${conversionPrecisionAmount} ${currencyTarget}`
}

const getSelectedCurrencies = () => { 
  const currencyBase = currencyOne.value
  const currencyTarget = currencyTwo.value

  return [ currencyBase, currencyTarget ]
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
