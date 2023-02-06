import React, { ReactElement, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import {
  createEventsEndpoint,
  EventModel,
  EVENTS_ROUTE,
  NotFoundError,
  pathnameFromRouteInformation,
  useLoadFromEndpoint,
} from 'api-client'

import { CityRouteProps } from '../CityContentSwitcher'
import Caption from '../components/Caption'
import CityContentLayout from '../components/CityContentLayout'
import CityContentToolbar from '../components/CityContentToolbar'
import EventListItem from '../components/EventListItem'
import FailureSwitcher from '../components/FailureSwitcher'
import { FeedbackRatingType } from '../components/FeedbackToolbarItem'
import Helmet from '../components/Helmet'
import JsonLdEvent from '../components/JsonLdEvent'
import List from '../components/List'
import LoadingSpinner from '../components/LoadingSpinner'
import Page, { THUMBNAIL_WIDTH } from '../components/Page'
import PageDetail from '../components/PageDetail'
import TextButton from '../components/TextButton'
import buildConfig from '../constants/buildConfig'
import { cmsApiBaseUrl } from '../constants/urls'
import DateFormatterContext from '../contexts/DateFormatterContext'
import useWindowDimensions from '../hooks/useWindowDimensions'
import featuredImageToSrcSet from '../utils/featuredImageToSrcSet'

const EventsPage = ({ cityModel, languages, pathname, languageCode, cityCode }: CityRouteProps): ReactElement => {
  const { eventId } = useParams()
  const { t } = useTranslation('events')
  const formatter = useContext(DateFormatterContext)
  const { viewportSmall } = useWindowDimensions()
  const navigate = useNavigate()

  const {
    data: events,
    loading,
    error: eventsError,
  } = useLoadFromEndpoint(createEventsEndpoint, cmsApiBaseUrl, { city: cityCode, language: languageCode })

  const event = eventId ? events?.find((event: EventModel) => event.path === pathname) : null

  const toolbar = (openFeedback: (rating: FeedbackRatingType) => void) => (
    <CityContentToolbar openFeedbackModal={openFeedback} viewportSmall={viewportSmall} />
  )

  const languageChangePaths = languages.map(({ code, name }) => {
    const isCurrentLanguage = code === languageCode
    const path = event
      ? event.availableLanguages.get(code) || null
      : pathnameFromRouteInformation({ route: EVENTS_ROUTE, cityCode, languageCode: code })
    return {
      path: isCurrentLanguage ? pathname : path,
      name,
      code,
    }
  })

  const locationLayoutParams = {
    cityModel,
    viewportSmall,
    feedbackTargetInformation: event ? { slug: event.slug } : null,
    languageChangePaths,
    route: EVENTS_ROUTE,
    languageCode,
    toolbar,
  }

  if (loading) {
    return (
      <CityContentLayout isLoading {...locationLayoutParams}>
        <LoadingSpinner />
      </CityContentLayout>
    )
  }

  if (!events || (eventId && !event)) {
    const error =
      eventsError ||
      new NotFoundError({
        type: 'event',
        id: pathname,
        city: cityCode,
        language: languageCode,
      })

    return (
      <CityContentLayout isLoading={false} {...locationLayoutParams}>
        <FailureSwitcher error={error} />
      </CityContentLayout>
    )
  }

  const downloadEventAsIcsFile = (event: EventModel) => {
    const blob = new Blob([event.toICal(window.location.origin, buildConfig().appName)], {
      type: 'text/calendar;charset=utf-8',
    })
    const anchorElement = document.createElement('a')
    anchorElement.href = window.URL.createObjectURL(blob)
    anchorElement.setAttribute('download', `${event.title}.ics`)
    document.body.appendChild(anchorElement)
    anchorElement.click()
    document.body.removeChild(anchorElement)
  }

  if (event) {
    const { featuredImage, thumbnail, lastUpdate, content, title, location, date } = event
    const defaultThumbnail = featuredImage ? featuredImage.medium.url : thumbnail
    const pageTitle = `${event.title} - ${cityModel.name}`

    const PageFooter = (
      <TextButton fullWidth={viewportSmall} onClick={() => downloadEventAsIcsFile(event)} text={t('exportAsICal')} />
    )

    return (
      <CityContentLayout isLoading={false} {...locationLayoutParams}>
        <Helmet pageTitle={pageTitle} languageChangePaths={languageChangePaths} cityModel={cityModel} />
        <JsonLdEvent event={event} formatter={formatter} />
        <Page
          defaultThumbnailSrc={defaultThumbnail}
          thumbnailSrcSet={featuredImage ? featuredImageToSrcSet(featuredImage, THUMBNAIL_WIDTH) : undefined}
          lastUpdate={lastUpdate}
          content={content}
          title={title}
          formatter={formatter}
          onInternalLinkClick={navigate}
          pageFooter={PageFooter}>
          <>
            <PageDetail identifier={t('date')} information={date.toFormattedString(formatter)} />
            {location && <PageDetail identifier={t('address')} information={location.fullAddress} />}
          </>
        </Page>
      </CityContentLayout>
    )
  }

  const renderEventListItem = (event: EventModel) => (
    <EventListItem event={event} formatter={formatter} key={event.path} />
  )

  const pageTitle = `${t('pageTitle')} - ${cityModel.name}`

  return (
    <CityContentLayout isLoading={false} {...locationLayoutParams}>
      <Helmet pageTitle={pageTitle} languageChangePaths={languageChangePaths} cityModel={cityModel} />
      <Caption title={t('events')} />
      <List noItemsMessage={t('currentlyNoEvents')} items={events} renderItem={renderEventListItem} />
    </CityContentLayout>
  )
}

export default EventsPage
