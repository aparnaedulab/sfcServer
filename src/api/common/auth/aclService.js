/*
 * Copyright (c) Akveo 2019. All Rights Reserved.
 * Licensed under the Single Application / Multi Application License.
 * See LICENSE_SINGLE_APP / LICENSE_MULTI_APP in the 'docs' folder for license information on type of purchased license.
 */
var path = require('path');
var root_path = path.dirname(require.main.filename);
var models = require(root_path + '/models');

function adminGuard(req, res, next) {
  if (req.user && (req.user.role === 'admin' || req.user.role === "superAdmin" || req.user.role === "subAdmin")) {
    next();
  } else {
    return res.status(403).send({ error: 'User should have admin access to use this endpoint' });
  }
}

function getUserRole(req, res, next){
  var count = 0;
  var count1 = 0;
  var roles = [];
  var university = [];
  var attest = ' '
  var verify = ' '
  models.Super_Role.findOne({
      where:{
          userid : req.user.id,
          activity : 'activate'
      }
  }).then(function(super_roles){
      if(super_roles){
        if(super_roles.marksheet == 1 && super_roles.transcript == 1 && super_roles.degree == 1 && super_roles.thesis == 1 && super_roles.moi == 1){
          attest = " ( afd.attestedfor like '%marksheet%' or afd.attestedfor like '%transcript%' or afd.attestedfor like '%degree%' or afd.attestedfor like '%thesis%' or afd.instructionalField = 1 ) ";
          verify = " OR ( vt.marksheet = 1 or vt.transcript = 1 or vt.degreeCertificate = 1 or vt.secondYear = 1 ) ";
        }else if(super_roles.marksheet == 1 && super_roles.transcript == 1 && super_roles.degree == 1 && super_roles.thesis == 1){
          attest = " ( afd.attestedfor like '%marksheet%' or afd.attestedfor like '%transcript%' or afd.attestedfor like '%degree%' or afd.attestedfor like '%thesis%' ) ";
          verify = " OR ( vt.marksheet = 1 or vt.transcript = 1 or vt.degreeCertificate = 1 ) ";
        }else if(super_roles.marksheet == 1 && super_roles.transcript == 1 && super_roles.degree == 1 && super_roles.moi == 1){
          attest = " ( afd.attestedfor like '%marksheet%' or afd.attestedfor like '%transcript%' or afd.attestedfor like '%degree%' or afd.instructionalField = 1 ) ";
          verify = " OR ( vt.marksheet = 1 or vt.transcript = 1 or vt.degreeCertificate = 1  or vt.secondYear = 1 ) ";
        }else if(super_roles.transcript == 1 && super_roles.degree == 1 && super_roles.thesis == 1 && super_roles.moi == 1 ){
          attest = " ( afd.instructionalField = 1 or afd.attestedfor like '%transcript%' or afd.attestedfor like '%degree%' or afd.attestedfor like '%thesis%' ) ";
          verify = " OR ( vt.transcript = 1 or vt.degreeCertificate = 1 or vt.secondYear = 1 ) ";
        }else if(super_roles.marksheet == 1 && super_roles.moi == 1 && super_roles.degree == 1 && super_roles.thesis == 1){
          attest = " ( afd.attestedfor like '%marksheet%' or afd.instructionalField = 1 or afd.attestedfor like '%degree%' or afd.attestedfor like '%thesis%' ) ";
          verify = " OR ( vt.marksheet = 1 or vt.degreeCertificate = 1 or vt.secondYear = 1 ) ";
        }else if(super_roles.marksheet == 1 && super_roles.transcript == 1 && super_roles.moi == 1 && super_roles.thesis == 1){
          attest = " ( afd.attestedfor like '%marksheet%' or afd.attestedfor like '%transcript%' or afd.instructionalField = 1 or afd.attestedfor like '%thesis%' ) ";
          verify = " OR ( vt.marksheet = 1 or vt.transcript = 1 or vt.secondYear = 1 ) ";
        }else if(super_roles.marksheet == 1 && super_roles.transcript == 1 && super_roles.degree == 1){
          attest = " ( afd.attestedfor like '%marksheet%' or afd.attestedfor like '%transcript%' or afd.attestedfor like '%degree%' ) ";
          verify = " OR ( vt.marksheet = 1 or vt.transcript = 1 or vt.degreeCertificate = 1 ) ";
        }else if(super_roles.marksheet == 1 && super_roles.transcript == 1 && super_roles.thesis == 1){
          attest = " ( afd.attestedfor like '%marksheet%' or afd.attestedfor like '%transcript%' or afd.attestedfor like '%thesis%' ) ";
          verify = " OR ( vt.marksheet = 1 or vt.transcript = 1 ) ";
        }else if(super_roles.marksheet == 1 && super_roles.transcript == 1 && super_roles.moi == 1){
          attest = " ( afd.attestedfor like '%marksheet%' or afd.attestedfor like '%transcript%' or afd.instructionalField = 1 ) ";
          verify = " OR ( vt.marksheet = 1 or vt.transcript = 1 or vt.secondYear = 1 ) ";
        }else if(super_roles.marksheet == 1 && super_roles.degree == 1 && super_roles.thesis == 1){
          attest = " ( afd.attestedfor like '%marksheet%' or afd.attestedfor like '%degree%' or afd.attestedfor like '%thesis%' ) ";
          verify = " OR ( vt.marksheet = 1 or vt.degreeCertificate = 1 ) ";
        }else if(super_roles.marksheet == 1 && super_roles.degree == 1 && super_roles.moi == 1){
          attest = " ( afd.attestedfor like '%marksheet%' or afd.attestedfor like '%degree%' or afd.instructionalField = 1 ) ";
          verify = " OR ( vt.marksheet = 1 or vt.degreeCertificate = 1 or vt.secondYear = 1 ) ";
        }else if(super_roles.marksheet == 1 && super_roles.thesis == 1 && super_roles.moi == 1){
          attest = " ( afd.attestedfor like '%marksheet%' or afd.attestedfor like '%thesis%' or afd.instructionalField = 1 ) ";
          verify = " OR ( vt.marksheet = 1 or vt.secondYear = 1  ) ";
        }else if(super_roles.transcript == 1 && super_roles.degree == 1 && super_roles.thesis == 1){
          attest = " ( afd.attestedfor like '%transcript%' or afd.attestedfor like '%degree%' or afd.attestedfor like '%thesis%' ) ";
          verify = " OR ( vt.transcript = 1 or vt.degreeCertificate = 1 ) ";
        }else if(super_roles.transcript == 1 && super_roles.degree == 1 && super_roles.moi == 1){
          attest = " ( afd.attestedfor like '%transcript%' or afd.attestedfor like '%degree%' or afd.instructionalField = 1 ) ";
          verify = " OR ( vt.transcript = 1 or vt.degreeCertificate = 1 or vt.secondYear = 1  ) ";
        }else if(super_roles.transcript == 1 && super_roles.thesis == 1 && super_roles.moi == 1){
          attest = " ( afd.attestedfor like '%transcript%' or afd.attestedfor like '%thesis%' or afd.instructionalField = 1 ) ";
          verify = " OR ( vt.transcript = 1 or vt.secondYear = 1 ) ";
        }else if(super_roles.degree == 1 && super_roles.thesis == 1 && super_roles.moi == 1){
          attest = " ( afd.attestedfor like '%degree%' or afd.attestedfor like '%thesis%' or afd.instructionalField = 1 ) ";
          verify = " OR ( vt.degreeCertificate = 1 or vt.secondYear = 1  ) ";
        }else if(super_roles.marksheet == 1 && super_roles.transcript == 1){
          attest = " ( afd.attestedfor like '%marksheet%' or afd.attestedfor like '%transcript%' ) ";
          verify = " OR ( vt.marksheet = 1 or vt.transcript = 1 ) ";
        }else if(super_roles.marksheet == 1 && super_roles.degree == 1){
          attest = " ( afd.attestedfor like '%marksheet%' or afd.attestedfor like '%degree%' ) ";
          verify = " OR ( vt.marksheet = 1 or vt.degreeCertificate = 1 ) ";
        }else if(super_roles.marksheet == 1 && super_roles.thesis == 1){
          attest = " ( afd.attestedfor like '%marksheet%' or afd.attestedfor like '%thesis%' ) ";
          verify = " OR ( vt.marksheet = 1 ) ";
        }else if(super_roles.marksheet == 1 && super_roles.moi == 1){
          attest = " ( afd.attestedfor like '%marksheet%' or afd.instructionalField = 1 ) ";
          verify = " OR ( vt.marksheet = 1 or vt.secondYear = 1 ) ";
        }else if(super_roles.transcript == 1 && super_roles.degree == 1){
          attest = " ( afd.attestedfor like '%transcript%' or afd.attestedfor like '%degree%' ) ";
          verify = " ( vt.transcript = 1 or vt.degreeCertificate = 1 ) ";
        }else if(super_roles.transcript == 1 && super_roles.thesis == 1){
          attest = " ( afd.attestedfor like '%transcript%' or afd.attestedfor like '%thesis%' ) ";
          verify = " OR ( vt.transcript = 1 ) ";
        }else if(super_roles.transcript == 1 && super_roles.moi == 1){
          attest = " ( afd.attestedfor like '%transcript%' or afd.instructionalField = 1 ) ";
          verify = " OR ( vt.transcript = 1 or vt.secondYear = 1 ) ";
        }else if(super_roles.degree == 1 && super_roles.thesis == 1){
          attest = " ( afd.attestedfor like '%degree%' or afd.attestedfor like '%thesis%' ) ";
          verify = " OR ( vt.degreeCertificate = 1 ) ";
        }else if(super_roles.degree == 1 && super_roles.moi == 1){
          attest = " ( afd.attestedfor like '%degree%' or afd.instructionalField = 1 ) ";
          verify = " OR ( vt.degreeCertificate = 1 or vt.secondYear = 1 ) ";
        }else if(super_roles.thesis == 1  && super_roles.moi == 1){
          attest = " ( afd.attestedfor like '%thesis%' or afd.instructionalField = 1 ) ";
          verify = " OR ( vt.secondYear = 1 )  ";
        }else if(super_roles.marksheet == 1){
          attest = " ( afd.attestedfor like '%marksheet%' ) ";
          verify = " OR ( vt.marksheet = 1 ) ";
        }else if(super_roles.transcript == 1){
          attest = " ( afd.attestedfor like '%transcript%' ) ";
          verify = " OR ( vt.transcript = 1 ) ";
        }else if(super_roles.degree == 1){
          attest = " ( afd.attestedfor like '%degree%' ) ";
          verify = " OR ( vt.degreeCertificate = 1 ) ";
        }else if(super_roles.thesis == 1){
          attest = " ( afd.attestedfor like '%thesis%' ) ";
          verify = " ";
        }else if(super_roles.moi == 1){
          attest = " ( afd.instructionalField = 1 ) ";
          verify = " OR ( vt.secondYear = 1 )";
        }else{
          attest = " OR 1=1 ";
          verify = " OR 1=1 ";
        }
        super_roles.university.forEach(function (uni){
          university.push(uni.university);
        })
        super_roles.source.forEach(function(role){
            roles.push(role.resource);
            count++;
            if(count == super_roles.source.length){
              super_roles.university.forEach(function(uni){
                  university.push(uni.resource);
                  count1++;
                  if(count1 == super_roles.university.length){
                    var queryRole = "('" + roles.join("','") + "')";
                    req.superRoles = queryRole;
                    var queryuniversity = "('" + university.join("','") + "')";
                    req.superuniversity = queryuniversity;
                    req.arrayRole = roles;
                    req.attest = attest;
                    req.verify = verify;
                    req.marksheet = super_roles.marksheet
                    req.transcript = super_roles.transcript
                    req.degree = super_roles.degree
                    req.thesis = super_roles.thesis
                    req.moi = super_roles.moi
                    next();
                  }
              })

            
            }
        })

      }else{
          next();
      }
  })
}

module.exports = {
  adminGuard,
  getUserRole
};
