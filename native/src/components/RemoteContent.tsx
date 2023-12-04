import { useFocusEffect } from '@react-navigation/native'
import React, { ReactElement, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Text, Platform } from 'react-native'
import WebView, { WebViewMessageEvent } from 'react-native-webview'
import { WebViewNavigation } from 'react-native-webview/lib/WebViewTypes'
import { useTheme } from 'styled-components/native'

import { CONSENT_ROUTE, ErrorCode } from 'api-client'

import buildConfig from '../constants/buildConfig'
import { userAgent } from '../constants/endpoint'
import {
  HEIGHT_MESSAGE_TYPE,
  IFRAME_MESSAGE_TYPE,
  SETTINGS_MESSAGE_TYPE,
  WARNING_MESSAGE_TYPE,
} from '../constants/webview'
import useNavigate from '../hooks/useNavigate'
import appSettings, { ExternalSourcePermission } from '../utils/AppSettings'
import { updateSourcePermissions } from '../utils/helpers'
import renderHtml from '../utils/renderHtml'
import { log, reportError } from '../utils/sentry'
import Failure from './Failure'
import { ParsedCacheDictionaryType } from './Page'

export const renderWebviewError = (
  errorDomain: string | null | undefined,
  errorCode: number,
  errorDesc: string,
): React.ReactElement => (
  <Text>
    ${errorDomain} ${errorCode} ${errorDesc}
  </Text>
)

type RemoteContentProps = {
  content: string
  cacheDictionary: ParsedCacheDictionaryType
  language: string
  resourceCacheUrl: string
  onLinkPress: (url: string) => void
  onLoad: () => void
}

// If the app crashes without an error message while using RemoteContent, consider wrapping it in a ScrollView or setting a manual height
const RemoteContent = (props: RemoteContentProps): ReactElement | null => {
  const { onLoad, content, cacheDictionary, resourceCacheUrl, language, onLinkPress } = props
  const [error, setError] = useState<string | null>(null)
  const [pressedUrl, setPressedUrl] = useState<string | null>(null)
  const [externalSourcePermissions, setExternalSourcePermissions] = useState<ExternalSourcePermission[]>([])
  const [reloadSettings, setReloadSettings] = useState<boolean>(false)
  const { navigateTo } = useNavigate()
  // https://github.com/react-native-webview/react-native-webview/issues/1069#issuecomment-651699461
  const defaultWebviewHeight = 1
  const [webViewHeight, setWebViewHeight] = useState<number>(defaultWebviewHeight)
  const theme = useTheme()
  const { t } = useTranslation()

  useEffect(() => {
    // If it takes too long returning false in onShouldStartLoadWithRequest the webview loads the pressed url anyway on android.
    // Therefore only set it to state and execute onLinkPress in useEffect.
    if (pressedUrl) {
      onLinkPress(pressedUrl)
      setPressedUrl(null)
    }
  }, [onLinkPress, pressedUrl])

  useEffect(() => {
    if (webViewHeight !== defaultWebviewHeight || content.length === 0) {
      onLoad()
    }
  }, [onLoad, webViewHeight, content])

  useFocusEffect(
    useCallback(() => {
      appSettings.loadExternalSourcePermissions().then(setExternalSourcePermissions).catch(reportError)
    }, []),
  )

  // Webview content does not reload on opt-in click
  useEffect(() => {
    if (reloadSettings) {
      appSettings.loadExternalSourcePermissions().then(setExternalSourcePermissions).catch(reportError)
      setReloadSettings(false)
    }
  }, [reloadSettings])

  // messages are triggered in renderHtml.ts
  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const message = JSON.parse(event.nativeEvent.data)
      if (message.type === HEIGHT_MESSAGE_TYPE && typeof message.height === 'number') {
        setWebViewHeight(message.height)
        return
      }

      if (message.type === SETTINGS_MESSAGE_TYPE && typeof message.openSettings === 'boolean') {
        navigateTo({ route: CONSENT_ROUTE })
        return
      }

      if (message.type === IFRAME_MESSAGE_TYPE && typeof message.allowedSource === 'object') {
        const updatedSources = updateSourcePermissions(externalSourcePermissions, message.allowedSource)
        appSettings.setExternalSourcePermissions(updatedSources).catch(reportError)
        setReloadSettings(true)
        return
      }

      if (message.type === WARNING_MESSAGE_TYPE) {
        log(message.message, 'warning')
      } else {
        const error = new Error(
          message.message ? JSON.stringify(message.message) : 'Unknown message received from webview',
        )
        reportError(error)
        setError(error.message)
      }
    },
    [externalSourcePermissions, navigateTo],
  )

  const onShouldStartLoadWithRequest = useCallback(
    (event: WebViewNavigation): boolean => {
      if (buildConfig().allowedIframeSources.some(source => event.url.indexOf(source) > 0)) {
        return true
      }
      if (event.url === new URL(resourceCacheUrl).href) {
        // Needed on iOS for the initial load
        return true
      }
      // block non click events on ios that come up with iframes to avoid opening the iframe source directly in browser
      if (event.navigationType !== 'click' && Platform.OS === 'ios') {
        return false
      }
      // If it takes too long returning false the webview loads the pressed url anyway on android.
      // Therefore only set it to state and execute onLinkPress in useEffect.
      setPressedUrl(event.url)
      return false
    },
    [resourceCacheUrl],
  )

  if (content.length === 0) {
    return null
  }
  if (error) {
    return <Failure code={ErrorCode.UnknownError} />
  }

  return (
    <WebView
      source={{
        baseUrl: resourceCacheUrl,
        html: renderHtml(
          content,
          cacheDictionary,
          buildConfig().allowedIframeSources,
          theme,
          language,
          externalSourcePermissions,
          t,
        ),
      }}
      originWhitelist={['*']} // Needed by iOS to load the initial html
      javaScriptEnabled
      dataDetectorTypes='none'
      userAgent={userAgent}
      domStorageEnabled={false}
      allowsFullscreenVideo
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      scrollEnabled={false} // To disable scrolling in iOS
      onMessage={onMessage}
      renderError={renderWebviewError}
      onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
      // To allow custom handling of link clicks in android
      // https://github.com/react-native-webview/react-native-webview/issues/1869
      setSupportMultipleWindows={false}
      style={{
        height: webViewHeight,

        opacity: 0.99, // fixes crashing in Android https://github.com/react-native-webview/react-native-webview/issues/811
      }}
    />
  )
}

export default RemoteContent
