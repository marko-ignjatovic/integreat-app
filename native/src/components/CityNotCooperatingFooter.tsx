import React, { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'react-native-elements'
import styled from 'styled-components/native'

import { ThemeType } from 'build-configs/ThemeType'

import buildConfig, { buildConfigAssets } from '../constants/buildConfig'

const FooterContainer = styled.View`
  background-color: ${props => props.theme.colors.backgroundAccentColor};
  display: flex;
  flex-direction: column;
  align-items: center;
  border-bottom: 2px solid ${props => props.theme.colors.textColor};
`
const Icon = styled.Image`
  margin: -5%;
  width: 30%;
  resize-mode: contain;
`

const Question = styled.Text`
  font-family: ${props => props.theme.fonts.native.decorativeFontBold};
  font-size: 16px;
`

const ButtonContainer = styled.View`
  width: 40%;
  margin: 30px 0 40px 0;
`

type CityNotCooperatingFooterPropsType = {
  navigateToCityNotCooperating: () => void
  theme: ThemeType
}

const CityNotCooperatingFooter = ({ navigateToCityNotCooperating, theme }: CityNotCooperatingFooterPropsType): ReactElement | null => {
  const { t } = useTranslation('landing')

  if (!buildConfig().featureFlags.cityNotCooperating) {
    return null
  }

  return (
    <FooterContainer>
      <Icon source={buildConfigAssets().cityNotCooperatingIcon!} />
      <Question>{t('cityNotFound')}</Question>
      <ButtonContainer>
        <Button
          title={t('clickHere')}
          onPress={navigateToCityNotCooperating}
          buttonStyle={{
            backgroundColor: theme.colors.themeColor,
          }}
          titleStyle={{
            color: theme.colors.textColor,
            fontFamily: theme.fonts.native.contentFontRegular,
          }}
        />
      </ButtonContainer>
    </FooterContainer>
  )
}

export default CityNotCooperatingFooter
