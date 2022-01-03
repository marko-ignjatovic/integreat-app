import { fireEvent } from '@testing-library/react'
import moment from 'moment'
import React from 'react'
import { Route } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'

import {
  CategoriesMapModel,
  CategoriesMapModelBuilder,
  CategoryModel,
  CityModelBuilder,
  LanguageModelBuilder,
  pathnameFromRouteInformation,
  SEARCH_ROUTE
} from 'api-client'
import { mockUseLoadFromEndpointWithData } from 'api-client/src/testing/mockUseLoadFromEndpoint'

import buildConfig from '../../constants/buildConfig'
import { renderWithBrowserRouter } from '../../testing/render'
import SearchPage from '../SearchPage'
import { RoutePatterns } from '../index'

jest.mock('react-i18next')
jest.mock('api-client', () => ({
  ...jest.requireActual('api-client'),
  useLoadFromEndpoint: jest.fn()
}))

describe('SearchPage', () => {
  const cities = new CityModelBuilder(2).build()
  const cityModel = cities[0]!
  const languages = new LanguageModelBuilder(2).build()
  const languageModel = languages[0]!

  const categoriesMap = new CategoriesMapModelBuilder('augsburg', 'en').build()
  const categoryModels = categoriesMap.toArray()
  const category0 = categoryModels[0]!
  const category1 = categoryModels[1]!

  const pathname = pathnameFromRouteInformation({
    route: SEARCH_ROUTE,
    cityCode: cityModel.code,
    languageCode: languageModel.code
  })

  it('should filter correctly', () => {
    mockUseLoadFromEndpointWithData(categoriesMap)

    const { getByText, queryByText, getByPlaceholderText } = renderWithBrowserRouter(
      <ThemeProvider theme={buildConfig().lightTheme}>
        <Route
          path={RoutePatterns[SEARCH_ROUTE]}
          render={props => (
            <SearchPage
              cities={cities}
              cityModel={cityModel}
              languages={languages}
              languageModel={languageModel}
              {...props}
            />
          )}
        />
      </ThemeProvider>,
      { route: pathname }
    )

    // the root category should not be returned
    expect(queryByText(category0.title)).toBeFalsy()
    expect(getByText(category1.title)).toBeTruthy()

    fireEvent.change(getByPlaceholderText('search:searchPlaceholder'), {
      target: {
        value: 'Does not exist!'
      }
    })

    expect(queryByText(category0.title)).toBeFalsy()
    expect(queryByText(category1.title)).toBeFalsy()

    fireEvent.change(getByPlaceholderText('search:searchPlaceholder'), {
      target: {
        value: category1.title
      }
    })

    expect(queryByText(category0.title)).toBeFalsy()
    expect(getByText(category1.title)).toBeTruthy()
  })

  it('should sort correctly', () => {
    const buildCategoryModel = (title: string, content: string) =>
      new CategoryModel({
        root: false,
        path: `/${title}`,
        title: `${title}-category`,
        content,
        parentPath: '/',
        order: 1,
        availableLanguages: new Map(),
        thumbnail: 'https://cms.integreat-ap…03/Beratung-150x150.png',
        hash: title,
        lastUpdate: moment('2017-11-18T19:30:00.000Z')
      })
    const categoryModels = [
      // should be 1st because 'abc' is in the title and it is lexicographically smaller than category 2
      buildCategoryModel('abc', ''),
      // should be 2nd because 'abc' is in the title but it is lexicographically bigger than category 1
      buildCategoryModel('defabc', ''),
      // should be 3rd because 'abc' is only in the content and the title is lexicographically smaller than category 4
      buildCategoryModel('def', 'abc'),
      // should be 4th because 'abc' is only in the content and the title is lexicographically bigger than category 3
      buildCategoryModel('ghi', 'abc')
    ]
    const categoriesMap = new CategoriesMapModel(categoryModels)
    mockUseLoadFromEndpointWithData(categoriesMap)

    const { getByPlaceholderText, getAllByLabelText } = renderWithBrowserRouter(
      <ThemeProvider theme={buildConfig().lightTheme}>
        <Route
          path={RoutePatterns[SEARCH_ROUTE]}
          render={props => (
            <SearchPage
              cities={cities}
              cityModel={cityModel}
              languages={languages}
              languageModel={languageModel}
              {...props}
            />
          )}
        />
      </ThemeProvider>,
      { route: pathname }
    )

    fireEvent.change(getByPlaceholderText('search:searchPlaceholder'), {
      target: {
        value: 'abc'
      }
    })

    const searchResults = getAllByLabelText('category', { exact: false })

    expect(searchResults[0]!.attributes.getNamedItem('aria-label')?.value).toBe(categoryModels[0]!.title)
    expect(searchResults[1]!.attributes.getNamedItem('aria-label')?.value).toBe(categoryModels[1]!.title)
    expect(searchResults[2]!.attributes.getNamedItem('aria-label')?.value).toBe(categoryModels[2]!.title)
    expect(searchResults[3]!.attributes.getNamedItem('aria-label')?.value).toBe(categoryModels[3]!.title)
  })

  describe('url query', () => {
    mockUseLoadFromEndpointWithData(categoriesMap)
    it('should set state from url', () => {
      const query = '?query=SearchForThis'
      const url = `${pathname}${query}`

      const { getByPlaceholderText } = renderWithBrowserRouter(
        <ThemeProvider theme={buildConfig().lightTheme}>
          <Route
            path={RoutePatterns[SEARCH_ROUTE]}
            render={props => (
              <SearchPage
                cities={cities}
                cityModel={cityModel}
                languages={languages}
                languageModel={languageModel}
                {...props}
              />
            )}
          />
        </ThemeProvider>,
        { route: url }
      )

      expect((getByPlaceholderText('search:searchPlaceholder') as HTMLInputElement).value).toBe('SearchForThis')
    })
  })

  it('should set url when state changes', () => {
    const { getByPlaceholderText } = renderWithBrowserRouter(
      <ThemeProvider theme={buildConfig().lightTheme}>
        <Route
          path={RoutePatterns[SEARCH_ROUTE]}
          render={props => (
            <SearchPage
              cities={cities}
              cityModel={cityModel}
              languages={languages}
              languageModel={languageModel}
              {...props}
            />
          )}
        />
      </ThemeProvider>,
      { route: pathname }
    )

    fireEvent.change(getByPlaceholderText('search:searchPlaceholder'), {
      target: {
        value: 'ChangeToThis'
      }
    })

    expect(global.window.location.href).toMatch(/\?query=ChangeToThis/)
  })

  it('should remove ?query= when filteredText is empty', () => {
    const query = '?query=RemoveThis'
    const url = `${pathname}${query}`

    const { getByPlaceholderText } = renderWithBrowserRouter(
      <ThemeProvider theme={buildConfig().lightTheme}>
        <Route
          path={RoutePatterns[SEARCH_ROUTE]}
          render={props => (
            <SearchPage
              cities={cities}
              cityModel={cityModel}
              languages={languages}
              languageModel={languageModel}
              {...props}
            />
          )}
        />
      </ThemeProvider>,
      { route: url }
    )

    fireEvent.change(getByPlaceholderText('search:searchPlaceholder'), {
      target: {
        value: ''
      }
    })

    expect(global.window.location.href).toMatch(/^((?!\?query=).)*$/)
  })
})
