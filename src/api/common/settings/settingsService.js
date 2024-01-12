/*
 * Copyright (c) Akveo 2019. All Rights Reserved.
 * Licensed under the Single Application / Multi Application License.
 * See LICENSE_SINGLE_APP / LICENSE_MULTI_APP in the 'docs' folder for license information on type of purchased license.
 */

const SettingsRepository = require('./settingsRepository');

class SettingsService {
  constructor() {
    this.repository = new SettingsRepository();
  }

  findById(id) {
    return this.repository.findById(id)
      .then(user => this.mapSettingsToDto(user));
  }

  edit(id, dto) {
    const settings = this.mapDtoToSettings(dto);
    return this.repository.edit(id, settings);
  }

  mapSettingsToDto(item) {
    return item ? {
      themeName: item.themeName,
      email: dto.email,
      mobile_country_code : dto.mobile_country_code,
      mobile: dto.mobile,
      user_type: dto.user_type,
      user_status : dto.user_status,
      name: dto.name,
      surname: dto.surname,
      address: dto.address
    } : {};
  }

  mapDtoToSettings(dto) {
    return dto ? {
      themeName: dto.themeName,
    } : {};
  }
}

module.exports = SettingsService;
