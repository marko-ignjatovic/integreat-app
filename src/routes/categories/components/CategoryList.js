// @flow

import React from 'react'

import RemoteContent from 'modules/common/components/RemoteContent'
import Caption from 'modules/common/components/Caption'
import CategoryListItem from './CategoryListItem'
import CategoryModel from '../../../modules/endpoint/models/CategoryModel'
import { List } from './CategoryList.styles'

type PropsType = {
  categories: Array<{|model: CategoryModel, subCategories: Array<CategoryModel>|}>,
  title?: string,
  content?: string,
  /** A search query to highlight in the categories titles */
  query?: string
}

/**
 * Displays a ContentList which is a list of categories, a caption and a thumbnail
 */
class CategoryList extends React.Component<PropsType> {
  render () {
    const {categories, title, content, query} = this.props
    return (
      <div>
        {title && <Caption title={title} />}
        <RemoteContent centered dangerouslySetInnerHTML={{__html: content}} />
        <List>
          {categories.map(({model, subCategories}) =>
            <CategoryListItem key={model.id}
                              category={model}
                              subCategories={subCategories}
                              query={query} />
          )}
        </List>
      </div>
    )
  }
}

export default CategoryList
