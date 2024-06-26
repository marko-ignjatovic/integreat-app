import { Endpoint, EndpointBuilder, CategoryModel } from '..'

import { API_VERSION } from '../constants'
import mapCategoryJson from '../mapping/mapCategoryJson'
import { JsonCategoryType } from '../types'

export const CATEGORY_CONTENT_ENDPOINT_NAME = 'categoryContent'
type ParamsType = {
  city: string
  language: string
  cityContentPath: string
}
export default (baseUrl: string): Endpoint<ParamsType, CategoryModel> =>
  new EndpointBuilder<ParamsType, CategoryModel>(CATEGORY_CONTENT_ENDPOINT_NAME)
    .withParamsToUrlMapper((params: ParamsType): string => {
      const { city, language, cityContentPath } = params
      const basePath = `/${city}/${language}`

      if (basePath === cityContentPath) {
        throw new Error('This endpoint does not support the root category!')
      }

      return `${baseUrl}/api/${API_VERSION}/${city}/${language}/page/?url=${cityContentPath}`
    })
    .withMapper((json: JsonCategoryType, params: ParamsType): CategoryModel => {
      const basePath = `/${params.city}/${params.language}`
      return mapCategoryJson(json, basePath)
    })
    .build()
