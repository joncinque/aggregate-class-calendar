import { Meteor } from 'meteor/meteor';

import { STYLE_MAP } from './parsecourse.js';

Meteor.methods({
  'studios.info'(courseObj)
  {
    this.unblock();
    let allInfo = 
    {
      postcodes: [],
      names: [],
      styles: []
    };

    for (let style in STYLE_MAP)
    {
      allInfo.styles.push(style);
    }

    let studioInfo = JSON.parse(Assets.getText('studios.json'));
    for (let index in studioInfo)
    {
      let studio = studioInfo[index];
      if (studio.locale !== undefined)
      {
        allInfo.postcodes.push(studio.locale.postcode);
        allInfo.names.push(studio.locale.name);
      }
      if (studio.locales !== undefined)
      {
        for (let id in studio.locales)
        {
          allInfo.postcodes.push(studio.locales[id].postcode);
          allInfo.names.push(studio.locales[id].name);
        }
      }
    }

    // Remove duplicates
    allInfo.postcodes = allInfo.postcodes.filter((itm,i,a)=>{
      return i==a.indexOf(itm);
    });
    allInfo.postcodes.sort();
    allInfo.names.sort();
    allInfo.styles.sort();
    return allInfo;
  },
});
