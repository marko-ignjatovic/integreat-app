import { fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { ThemeProvider } from 'styled-components'

import { UiDirectionType } from 'translations'

import buildConfig from '../../constants/buildConfig'
import { renderWithTheme } from '../../testing/render'
import SearchFeedback from '../SearchFeedback'

jest.mock('react-inlinesvg')
jest.mock('react-i18next')

describe('SearchFeedback', () => {
  const cityCode = 'augsburg'
  const languageCode = 'de'

  const theme = { ...buildConfig().lightTheme, contentDirection: 'ltr' as UiDirectionType }

  it('should open FeedbackSection on button click', () => {
    const { getByText, queryByText } = renderWithTheme(
      <SearchFeedback cityCode={cityCode} languageCode={languageCode} query='ab' noResults={false} />,
    )
    expect(queryByText('feedback:wantedInformation')).toBeNull()

    fireEvent.click(getByText('feedback:informationNotFound'))

    expect(getByText('feedback:wantedInformation')).toBeTruthy()
  })

  it('should stop showing feedback if query changes', () => {
    const { getByText, queryByText, rerender } = renderWithTheme(
      <SearchFeedback cityCode={cityCode} languageCode={languageCode} query='ab' noResults={false} />,
    )
    expect(queryByText('feedback:wantedInformation')).toBeNull()
    fireEvent.click(getByText('feedback:informationNotFound'))
    expect(getByText('feedback:wantedInformation')).toBeTruthy()

    rerender(
      <ThemeProvider theme={theme}>
        <SearchFeedback cityCode={cityCode} languageCode={languageCode} query='a' noResults={false} />
      </ThemeProvider>,
    )

    expect(queryByText('feedback:wantedInformation')).toBeNull()
  })

  it('should show feedback if no results found', () => {
    const { getByText } = renderWithTheme(
      <SearchFeedback cityCode={cityCode} languageCode={languageCode} query='ab' noResults />,
    )
    expect(getByText('feedback:send')).toBeTruthy()
  })

  it('should not allow sending search feedback if query term is removed', async () => {
    const { getByText, rerender } = renderWithTheme(
      <SearchFeedback cityCode={cityCode} languageCode={languageCode} query='ab' noResults />,
    )
    expect(getByText('feedback:send')).toBeEnabled()

    // the query is controlled in the parent of SearchFeedback, so we need to update the props
    rerender(
      <ThemeProvider theme={theme}>
        <SearchFeedback cityCode={cityCode} languageCode={languageCode} query='' noResults />
      </ThemeProvider>,
    )
    await waitFor(() => expect(getByText('feedback:send')).toBeDisabled())
  })
})
