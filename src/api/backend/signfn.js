const fs = require('fs');
var path = require('path');
var root_path = path.dirname(require.main.filename);
var constant = require(root_path+'/config/constant');
const logger = require('../../logger')(__filename);
var moment=require('moment');
const functions = require('../../utils/function');
const { Op } = require("sequelize");
const PDFDocument = require('pdfkit');
var unirest = require('unirest');
const signer = require('node-signpdf').default;
const { addSignaturePlaceholder } = require('node-signpdf/dist/helpers');
var qpdf = require('node-qpdf');
var PDF2Pic = require('pdf2pic');
const PNG = require("pngjs").PNG;
const { sign } = require('pdf-signer');
var gm = require('gm').subClass({imageMagick: true});
var models  = require(root_path+'/models');
var PDFImage = require("pdf-image").PDFImage;
const { exec } = require('child_process');
var obj = {"username":"Gujarat","password":"bnBdO9x96h7r"}


const https = require('https');

module.exports.pdfpop = async function(filename,user_id,type) {
  var pdfstatus;
    var name_pdf=path.parse(filename).name;
    var file;
	let converter
    if(type == "transcript"){
       file = constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+filename;
	converter = new PDF2Pic({
      density: 100,           
      savename: "con2img_"+name_pdf,   
      savedir: constant.FILE_LOCATION+"public/upload/documents/"+user_id,    
      format: "png",          
      size: 600               
    })
    }else if( type == "marksheet"){
       file = constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+filename;
	converter = new PDF2Pic({
      density: 100,           
      savename: "con2img_"+name_pdf,   
      savedir: constant.FILE_LOCATION+"public/upload/documents/"+user_id,    
      format: "png",          
      size: 600               
    })
    }
 
   
    
    converter.convert(file)
      .then(resolve => {
	logger.info("resolve ==>"+JSON.stringify(resolve ));

        pdfstatus = true;
      }).catch(error => {
                        pdfstatus=false;
	logger.error("error==>"+JSON.stringify(error))
                        logger.error("There is problem in conversion of user transcript pdf file to img");
                    })
    
            return new Promise(resolve => {
              setTimeout(() => {
                  
                resolve(pdfstatus);
              }, 2000);
            });
     
}

module.exports.merge_alldocs = async function (app_id,user_id, mergefilesString){
  logger.info("merge_alldocs called for application no : "+mergefilesString)
  var outputfile = constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+app_id+"_UploadedDocument_Merge.pdf" ;
  var command = "pdfunite "+mergefilesString+ " " +outputfile;
  const pdfunite = exec(command, function (error, stdout, stderr) {
    if (error) {
      logger.error(error.stack);
      logger.error('Error code: '+error.code);
      logger.error('Signal received: '+error.signal);
    }else{
     
    }
    logger.debug('Child Process STDOUT: '+stdout);
    logger.error('Child Process STDERR: '+stderr);
  });

  pdfunite.on('exit', function (code) {
    logger.debug('Child process exited with exit code '+code);
  });
}
module.exports.pdfpop_new = function(filename,user_id,type,callback) {
  var pdfstatus;
  var name_pdf=path.parse(filename).name;
  var file;
	let converter
    if(type == "transcript"){
      file = constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+filename;
	    converter = new PDF2Pic({
        density: 100,           
        savename: "con2img_"+name_pdf,   
        savedir: constant.FILE_LOCATION+"public/upload/documents/"+user_id,    
        format: "png",          
        size: 600               
      })
    }else if( type == "marksheet"){
      file = constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+filename;
	    converter = new PDF2Pic({
        density: 100,           
        savename: "con2img_"+name_pdf,   
        savedir: constant.FILE_LOCATION+"public/upload/documents/"+user_id,    
        format: "png",          
        size: 600               
      })
    }else if(type == "CompetencyLetter"){
      file = constant.FILE_LOCATION+"public/upload/CompetencyLetter/"+user_id+"/"+filename;
      converter = new PDF2Pic({
        density: 100,           
        savename: "con2img_"+name_pdf,   
        savedir: constant.FILE_LOCATION+"public/upload/CompetencyLetter/"+user_id,    
        format: "png",          
        size: 600               
      })
    }
    converter.convert(file).then(resolve => {
	    logger.info("resolve ==>"+JSON.stringify(resolve ));
       pdfstatus = true;
       callback();
    }).catch(error => {
      pdfstatus=false;
      logger.error("error==>"+JSON.stringify(error))
      logger.error("There is problem in conversion of user transcript pdf file to img");
      callback("There is problem in conversion of user transcript pdf file to img");
	  })
    // return new Promise(resolve => {
    //   setTimeout(() => {
    //     resolve(pdfstatus);
    //   }, 2000);
    // }); 
}

module.exports.pdftomultipleimg = async function(filename,user_id,numOfpages) {
  var pdfstatus;
	if(!fs.existsSync(constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+path.parse(filename).name+"/")){
          fs.mkdirSync(constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+path.parse(filename).name+"/", { recursive: true });//fs.writeFileSync
    }

  var count = 0;

  file = constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+filename;
	converter = new PDF2Pic({
      density: 100,           
      savename: path.parse(filename).name,   
      savedir: constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+path.parse(filename).name+"/",   
      format: "jpg",          
      size: "612"             
    })
   
    promise1 = new Promise((resolve, reject) => {
    converter.convertBulk(file, -1)
      .then(resolve => {
       logger.info("resolve ==>"+resolve );
        pdfstatus = true;
        count++;
      }).catch(error => {
                        pdfstatus=false;
	logger.error("error==>"+JSON.stringify(error))
                        logger.error("There is problem in conversion of user transcript pdf file to img");
                    })
                    
                setTimeout(()=>{
                  if(numOfpages == count){
                    resolve(true); 
                  }else{
                    resolve(false);
                  }
                },3000)
                   
              })

              
              Promise.all([promise1]).then(result => {
                return new Promise(resolve => {
                  setTimeout(() => {
                   resolve(result[0]);
                  }, 2000);
                });
              })
}

// module.exports.pdftomultipleimg_new = async function(filename,user_id,numOfpages,callback) {
//   var pdfstatus;
// 	if(!fs.existsSync(constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+path.parse(filename).name+"/")){
//           fs.mkdirSync(constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+path.parse(filename).name+"/", { recursive: true });//fs.writeFileSync
//     }

//   var count = 0;

//   file = constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+filename;
// 	converter = new PDF2Pic({
//       density: 100,           
//       savename: path.parse(filename).name,   
//       savedir: constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+path.parse(filename).name+"/",   
//       format: "jpg",          
//       size: "612"             
//     })
   
//     promise1 = new Promise((resolve, reject) => {
//     converter.convertBulk(file, -1)
//       .then(resolve => {
//        logger.info("resolve ==>"+resolve );
//         pdfstatus = true;
//         count++;
        
//       }).catch(error => {
//         pdfstatus=false;
// 	      logger.error("error==>"+JSON.stringify(error))
//         logger.error("There is problem in conversion of user transcript pdf file to img");
//         callback("There is problem in conversion of user transcript pdf file to img")
//       })
                    
//       setTimeout(()=>{
//         if(numOfpages == count){
//           resolve(true); 
          
//         }else{
//          resolve(false);
//         }
//       },3000)
          
//     })

//     callback();       
//               // Promise.all([promise1]).then(result => {
//               //   return new Promise(resolve => {
//               //     setTimeout(() => {
//               //      resolve(result[0]);
//               //     }, 2000);
//               //   });
//               // })
// }

module.exports.pdftomultipleimg_new = async function(filename,user_id,numOfpages) {
  var pdfstatus;
	if(!fs.existsSync(constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+path.parse(filename).name+"/")){
          fs.mkdirSync(constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+path.parse(filename).name+"/", { recursive: true });//fs.writeFileSync
    }

  var count = 0;

  file = constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+filename;
  var output_file = constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+path.parse(filename).name + "/" + path.parse(filename).name

    var command = "pdftoppm -jpeg " + file +  " " + output_file;
    const pdfToImg = exec(command, function (error, stdout, stderr) {
      if (error) {
        logger.error(error.stack);
        logger.error('Error code: '+error.code);
        logger.error('Signal received: '+error.signal);
      }else{
      }
      logger.debug('Child Process STDOUT: '+stdout);
      logger.error('Child Process STDERR: '+stderr);

    });

    pdfToImg.on('exit', function (code) {
    logger.debug('Child process exited with exit code '+code);
    });
	// converter = new PDF2Pic({
  //     density: 100,           
  //     savename: path.parse(filename).name,   
  //     savedir: constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+path.parse(filename).name+"/",   
  //     format: "jpg",          
  //     size: "612"             
  //   })
   
  //   promise1 = new Promise((resolve, reject) => {
  //   converter.convertBulk(file, -1)
  //     .then(resolve => {
  //      logger.info("resolve ==>"+resolve );
  //       pdfstatus = true;
  //       count++;
        
  //     }).catch(error => {
  //       pdfstatus=false;
	//       logger.error("error==>"+JSON.stringify(error))
  //       logger.error("There is problem in conversion of user transcript pdf file to img");
  //       callback("There is problem in conversion of user transcript pdf file to img")
  //     })
                    
  //     setTimeout(()=>{
  //       if(numOfpages == count){
  //         resolve(true); 
          
  //       }else{
  //         resolve(false);
  //       }
  //     },3000)
          
  //   })

          
  //             // Promise.all([promise1]).then(result => {
  //             //   return new Promise(resolve => {
  //             //     setTimeout(() => {
  //             //      resolve(result[0]);
  //             //     }, 2000);
  //             //   });
  //             // })
}

module.exports.signedpdf = async function(filename, user_id, appl_id, file_loc, signstatus, transcript_id, marksheet_id, doc_type,category,count, curriculum_id){
  logger.debug("signedpdf called for "+filename);
var signstatus;
     var name_pdf = filename;
      const createPdf = (params = {
         placeholder: { reason : 'Digital signed by University Of Gujarat' },
       }) => new Promise((resolve) => {
         const pdf = new PDFDocument({
             autoFirstPage: true,
             size: 'A4',
             layout: 'portrait',
             bufferPages: true,
             margins : { 
               top: 72, 
               bottom: 20,
               left: 72,
               right: 72
           },
           info: {
               Author: 'Gujarat University',
               Subject: 'Digital Signature', 
               CreationDate: moment.utc(Date.now()).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'), 
           }
         });
         pdf.image(constants.FILE_LOCATION+'public/profile_pic/notforprint.jpg', 0,0, {width: pdf.page.width, height: pdf.page.height});
         pdf.info.CreationDate = '';
         pdf.fillColor('#333').fontSize(25).moveDown().text(params.text);
     
         const pdfChunks = [];
         pdf.on('data', (data) => {
             pdfChunks.push(data);
         });
     
         pdf.image(file_loc,0,0, {
           size: 'A4',
           align: 'center',
           width: 600,
           height:pdf.page.height - 90,
           note:'Digitally signed by University Of Gujarat',
       }).moveDown(0.2);
       pdf.moveTo(20, pdf.page.height - 92) 
       .lineTo( pdf.page.width-20, pdf.page.height - 92) 
       .dash(10, {space: 0}) 
       .stroke() ;
       pdf.moveTo(20, pdf.page.height - 94)  
       .lineTo(pdf.page.width-20, pdf.page.height - 94)  
       .dash(10, {space: 0}) 
       .stroke() ;
        
      pdf.image(constant.FILE_LOCATION+'public/upload/profile_pic/gu_Stamp.png',300,755,{fit: [85, 85], align: 'center'});
      pdf.image(constant.FILE_LOCATION+'public/upload/profile_pic/sample_signature.jpeg',430,755,{width: 130,height: 80, align: 'center'});
      
      pdf.on('end', () => {
               resolve(Buffer.concat(pdfChunks));
       });
         
         const refs = addSignaturePlaceholder({
             pdf,
             reason: 'Approved',
             ...params.placeholder,
         });
     
         Object.keys(refs).forEach(key => refs[key].end());
         pdf.end();
     });
       
       const action = async () => {
         //logger.debug("action called")
         let pdfBuffer = await createPdf();
         let p12Buffer = fs.readFileSync(constant.Certificate_Url+'certificateATT.pfx');
         var pdf = signer.sign(pdfBuffer, p12Buffer, { passphrase : constant.PASSPHRASE, asn1StrictParsing : true });
          try{
            var fpath=constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/";
            var fname ;
            models.Institution_details.findAll({
              where:
              {
                user_id : user_id,
                app_id: appl_id
               }
              }) .then(function(resultset){
              
             
                if(resultset && resultset[0] != undefined){
                 if(resultset[0]['wesno'] != "" &&  
                 resultset[0]['wesno'] != undefined && 
                 resultset[0]['wesno'].length != 0){
                   fname= doc_type+"_"+resultset[0]['wesno']+"-"+count+".pdf";
                 // logger.verbose("@1 " + resultset[0]['wesno'] + " filename " + resultset[0]['wesno']+"-"+count)
                 }else if (resultset[0]['cesno'] != ""&&  
                 resultset[0]['cesno'] != undefined && 
                 resultset[0]['cesno'].length != 0){
                  fname= doc_type+"_"+resultset[0]['cesno']+"-"+count+".pdf";
                 // logger.verbose("@2 "+ resultset[0]['cesno'])
                 }else if (resultset[0]['iqasno'] != ""&&  
                 resultset[0]['iqasno'] != undefined && 
                 resultset[0]['iqasno'].length != 0) {
                  fname= doc_type+"_"+resultset[0]['iqasno']+"-"+count+".pdf";
                 // logger.verbose("@3")
                 }else if(resultset[0]['eduperno'] != ""&&  
                 resultset[0]['eduperno'] != undefined && 
                 resultset[0]['eduperno'].length != 0){
                  fname= doc_type+"_"+resultset[0]['eduperno']+"-"+count+".pdf";
                 // logger.verbose("@4")
                 }else if(resultset[0]['icasno'] != ""&&  
                 resultset[0]['icasno'] != undefined && 
                 resultset[0]['icasno'].length != 0){
                  fname= doc_type+"_"+resultset[0]['icasno']+"-"+count+".pdf";
                 // logger.verbose("@5")
                 }else if(resultset[0]['studyrefno'] != ""&&  
                 resultset[0]['studyrefno'] != undefined && 
                 resultset[0]['studyrefno'].length != 0){
                  fname= doc_type+"_"+resultset[0]['studyrefno']+"-"+count+".pdf";
                 // logger.verbose("@6")
                 }else if(resultset[0]['emprefno'] != ""&&  
                 resultset[0]['emprefno'] != undefined && 
                 resultset[0]['emprefno'].length != 0){
                  fname= doc_type+"_"+resultset[0]['emprefno']+"-"+count+".pdf";
                 // logger.verbose("@7")
                 }else if(resultset[0]['visarefno'] != ""&&  
                 resultset[0]['visarefno'] != undefined && 
                 resultset[0]['visarefno'].length != 0){
                  fname= doc_type+"_"+resultset[0]['visarefno']+"-"+count+".pdf";
                 // logger.verbose("@8")
                 }else {
                  fname = appl_id+"_"+doc_type+"_"+name_pdf+"-"+count+".pdf";
                 // logger.verbose("@default")
                 }
                }else {
                  fname = appl_id+"_"+doc_type+"_"+filename+"-"+count+".pdf";
                }     
            var fullfile = fpath+fname;
         //   logger.debug("fullfile : "+fullfile)
            if (!fs.existsSync(fullfile)) {
              signstatus = true;

              var file=fs.writeFileSync(fullfile,pdf, function (err) {
                if (err) {
                }
              });
               fs.exists(fullfile, function (exists) {
                if (exists) {
                  models.Institution_details.find({
                    where :{
                      app_id  :appl_id
                    }
                  }).then(function(details){ 
                    if(details.type == "Educational credential evaluators WES"){  
                      fileTransferWes(user_id,appl_id,fullfile);
                    }else {
                    }
                  })
                //  compress(fullfile,fname);
                }
              })

  models.Emailed_Docs.create({
                filename : fname,
                doc_type : doc_type,
                category : category,
                user_id: user_id,
                transcript_id: transcript_id,
                marklist_id : marksheet_id,
                app_id:appl_id,
                curriculum_id : curriculum_id
              }).then((result)=>{
               // logger.debug(" result : "+JSON.stringify(result))
              })
            }else{
              signstatus = true;
            }
          })
          }catch(error){
            signstatus = false;
            logger.error("There is problem in generating signed pdf."+error);
          }
       }
     
        action();
  
       return new Promise(resolve => {
          setTimeout(() => {
              
            resolve(signstatus);
          }, 5000);
        });
} 

 module.exports.signedpdf_new = async function(filename, user_id, appl_id, file_loc, signstatus, transcript_id, marksheet_id, doc_type,category,count, curriculum_id,competency_id,letter_id,callback){
  logger.debug("signedpdf_newsignedpdf_new called for "+category);
  var signstatus;
  var name_pdf = filename;
  const createPdf = (params = {
    placeholder: { reason : 'Digital signed by University Of Gujarat' },
  }) => new Promise((resolve) => {
  const pdf = new PDFDocument({
    autoFirstPage: true,
    size: 'RA4',
    layout: 'portrait',
    bufferPages: true,
    margins : { 
      top: 72, 
      bottom: 20,
      left: 72,
      right: 72
    },
    info: {
      Author: 'Gujarat University',
      Subject: 'Digital Signature', 
      CreationDate: moment.utc(Date.now()).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'), 
    }
  });
  pdf.info.CreationDate = '';
  pdf.fillColor('#333').fontSize(25).moveDown().text(params.text);
  const pdfChunks = [];
  pdf.on('data', (data) => {
    pdfChunks.push(data);
  });
  pdf.image(file_loc,0,0, {
    size: 'RA4',
    align: 'center',
    width: 600,
    height:pdf.page.height - 90,
    note:'Digitally signed by University Of Gujarat',
  }).moveDown(0.2);
  pdf.moveTo(20, pdf.page.height - 92) 
  .lineTo( pdf.page.width-20, pdf.page.height - 92) 
  .dash(10, {space: 0}) 
  .stroke() ;
  pdf.moveTo(20, pdf.page.height - 94)  
  .lineTo(pdf.page.width-20, pdf.page.height - 94)  
  .dash(10, {space: 0}) 
  .stroke() ;

  if(category == 'Marklist'){
    pdf.image(constant.FILE_LOCATION+'public/upload/profile_pic/marksheetStamp.png',300,765,{width: 160,height: 100, align: 'center'});
  }
  
  if(category == 'Transcript'){
    pdf.image(constant.FILE_LOCATION +'public/upload/profile_pic/transcriptStamp.png',300,765,{width: 150,height: 80, align: 'center'});
  }
  if(category == 'Degree'){
    pdf.image(constant.FILE_LOCATION+'public/upload/profile_pic/marksheetStamp.png',300,765,{width: 160,height: 100, align: 'center'});
  }
  else{
    pdf.image(constant.FILE_LOCATION+'public/upload/profile_pic/marksheetStamp.png',300,765,{width: 160,height: 100, align: 'center'});
  }


  // pdf.image(constant.FILE_LOCATION+'public/upload/profile_pic/sample_signature.jpeg',430,765,{width: 130,height: 80, align: 'center'});
  pdf.on('end', () => {
    resolve(Buffer.concat(pdfChunks));
  });
  const refs = addSignaturePlaceholder({
    pdf,
    reason: 'Approved',
    ...params.placeholder,
  });
  Object.keys(refs).forEach(key => refs[key].end());
    pdf.end();
  });
  const action = async () => {
    //logger.debug("action called")
    let pdfBuffer = await createPdf();
    let p12Buffer = fs.readFileSync(constant.Certificate_Url+'certificateATT.pfx');
    var pdf = signer.sign(pdfBuffer, p12Buffer, { passphrase : constant.PASSPHRASE, asn1StrictParsing : true });
    try{
      var fpath=constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/";
      var fname ;
      // models.Institution_details.findAll({
      //   where:{
      //     user_id : user_id,
      //     app_id: appl_id
      //   }
      // }) .then(function(resultset){
      //   if(resultset && resultset[0] != undefined){
      //     if(resultset[0]['wesno'] != "" && resultset[0]['wesno'] != undefined && resultset[0]['wesno'].length != 0){
      //       fname= doc_type+"_"+resultset[0]['wesno']+"-"+count+".pdf";
      //       // logger.verbose("@1 " + resultset[0]['wesno'] + " filename " + resultset[0]['wesno']+"-"+count)
      //     }else if (resultset[0]['cesno'] != "" && resultset[0]['cesno'] != undefined && resultset[0]['cesno'].length != 0){
      //       fname= doc_type+"_"+resultset[0]['cesno']+"-"+count+".pdf";
      //       // logger.verbose("@2 "+ resultset[0]['cesno'])
      //     }else if (resultset[0]['iqasno'] != "" && resultset[0]['iqasno'] != undefined && resultset[0]['iqasno'].length != 0) {
      //       fname= doc_type+"_"+resultset[0]['iqasno']+"-"+count+".pdf";
      //       // logger.verbose("@3")
      //     }else if(resultset[0]['eduperno'] != "" && resultset[0]['eduperno'] != undefined && resultset[0]['eduperno'].length != 0){
      //       fname= doc_type+"_"+resultset[0]['eduperno']+"-"+count+".pdf";
      //       // logger.verbose("@4")
      //     }else if(resultset[0]['icasno'] != "" && resultset[0]['icasno'] != undefined && resultset[0]['icasno'].length != 0){
      //       fname= doc_type+"_"+resultset[0]['icasno']+"-"+count+".pdf";
      //       // logger.verbose("@5")
      //     }else if(resultset[0]['studyrefno'] != "" && resultset[0]['studyrefno'] != undefined && resultset[0]['studyrefno'].length != 0){
      //       fname= doc_type+"_"+resultset[0]['studyrefno']+"-"+count+".pdf";
      //       // logger.verbose("@6")
      //     }else if(resultset[0]['emprefno'] != "" && resultset[0]['emprefno'] != undefined && resultset[0]['emprefno'].length != 0){
      //       fname= doc_type+"_"+resultset[0]['emprefno']+"-"+count+".pdf";
      //       // logger.verbose("@7")
      //     }else if(resultset[0]['visarefno'] != "" && resultset[0]['visarefno'] != undefined && resultset[0]['visarefno'].length != 0){
      //       fname= doc_type+"_"+resultset[0]['visarefno']+"-"+count+".pdf";
      //       // logger.verbose("@8")
      //     }else {
      //       fname = appl_id+"_"+doc_type+"_"+name_pdf+"-"+count+".pdf";
      //       // logger.verbose("@default")
      //     }
      //   }else {
      //     fname = appl_id+"_"+doc_type+"_"+filename+"-"+count+".pdf";
      //   }     
      //   var fullfile = fpath+fname;
      //   //logger.debug("fullfile : "+fullfile)
      //   if (!fs.existsSync(fullfile)) {
      //     signstatus = true;
      //     var file=fs.writeFileSync(fullfile,pdf, function (err) {
      //       if (err) {
      //         callback(err);
      //       }
      //     });
      //     fs.exists(fullfile, function (exists) {
      //       if (exists) {
      //         // models.Institution_details.find({
      //         //   where :{
      //         //     app_id  :appl_id
      //         //   }
      //         // }).then(function(details){ 
      //         //   if(details.type == "Educational credential evaluators WES"){  
      //         //     fileTransferWes(user_id,appl_id,fullfile);
      //         //   }else {
      //         //   }
      //         // })
      //         //  compress(fullfile,fname);
      //       }
      //     })
      //     models.Emailed_Docs.find({
      //       where : {
      //         filename : fname,
      //         transcript_id: transcript_id,
      //         app_id:appl_id,
      //       }
      //     }).then(function(emailedDoc){
      //       if(emailedDoc){

      //       }else{
      //         models.Emailed_Docs.create({
      //       filename : fname,
      //       doc_type : doc_type,
      //       category : category,
      //       user_id: user_id,
      //       transcript_id: transcript_id,
      //       marklist_id : marksheet_id,
      //       app_id:appl_id,
      //       curriculum_id : curriculum_id
      //         }).then((result)=>{
      //           // logger.debug(" result : "+JSON.stringify(result))
      //         })
      //       }
      //     })
      //   }else{
      //     signstatus = true;
      //   }
      // })
      fname = doc_type+"_"+filename+"-"+".pdf";
      var fullfile = fpath+fname;
        //logger.debug("fullfile : "+fullfile)
        if (!fs.existsSync(fullfile)) {
          signstatus = true;
          var file=fs.writeFileSync(fullfile,pdf, function (err) {
            if (err) {
              callback(err);
            }
          });
          models.Emailed_Docs.find({
            where : {
              filename : fname,
              transcript_id: transcript_id,
              app_id:appl_id,
            }
          }).then(function(emailedDoc){
            if(emailedDoc){

            }else{
              models.Emailed_Docs.create({
            filename : fname,
            doc_type : doc_type,
            category : category,
            user_id: user_id,
            transcript_id: transcript_id,
            marklist_id : marksheet_id,
            app_id:appl_id,
            curriculum_id : curriculum_id,
            gradToPer_id : letter_id,
            competency_id :competency_id
              }).then((result)=>{
                // logger.debug(" result : "+JSON.stringify(result))
              })
            }
          })
        }else{
          signstatus = true;
        }
      callback();
    }catch(error){
      signstatus = false;
      logger.error("There is problem in generating signed pdf."+error);
      callback(error);
    }
  }
  action();
  // return new Promise(resolve => {
  //   setTimeout(() => {
  //     resolve(signstatus);
  //   }, 5000);
  // });
}


module.exports.signedpdf_competency = async function(filename, user_id, appl_id, file_loc, signstatus, transcript_id, marksheet_id, doc_type,category,count, curriculum_id,competency_id,letter_id,callback){
  logger.debug(" signedpdf_competency signedpdf called for "+filename);
  var signstatus;
  var name_pdf = filename;
  const createPdf = (params = {
    placeholder: { reason : 'Digital signed by University Of Gujarat' },
  }) => new Promise((resolve) => {
  const pdf = new PDFDocument({
    autoFirstPage: true,
    size: 'RA4',
    layout: 'portrait',
    bufferPages: true,
    margins : { 
      top: 72, 
      bottom: 20,
      left: 72,
      right: 72
    },
    info: {
      Author: 'Gujarat University',
      Subject: 'Digital Signature', 
      CreationDate: moment.utc(Date.now()).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'), 
    }
  });
  pdf.info.CreationDate = '';
  pdf.fillColor('#333').fontSize(25).moveDown().text(params.text);
  const pdfChunks = [];
  pdf.on('data', (data) => {
    pdfChunks.push(data);
  });
  pdf.image(file_loc,0,0, {
    size: 'RA4',
    align: 'center',
    width: 600,
    height:pdf.page.height - 90,
    note:'Digitally signed by University Of Gujarat',
  }).moveDown(0.2);
  pdf.moveTo(20, pdf.page.height - 92) 
  .lineTo( pdf.page.width-20, pdf.page.height - 92) 
  .dash(10, {space: 0}) 
  .stroke() ;
  pdf.moveTo(20, pdf.page.height - 94)  
  .lineTo(pdf.page.width-20, pdf.page.height - 94)  
  .dash(10, {space: 0}) 
  .stroke() ;
  pdf.image(constant.FILE_LOCATION+'public/upload/profile_pic/gu_Stamp.png',300,765,{fit: [85, 85], align: 'center'});
  pdf.image(constant.FILE_LOCATION+'public/upload/profile_pic/sample_signature.jpeg',430,765,{width: 130,height: 80, align: 'center'});
  pdf.on('end', () => {
    resolve(Buffer.concat(pdfChunks));
  });
  const refs = addSignaturePlaceholder({
    pdf,
    reason: 'Approved',
    ...params.placeholder,
  });
  Object.keys(refs).forEach(key => refs[key].end());
    pdf.end();
  });
  const action = async () => {
    //logger.debug("action called")
    let pdfBuffer = await createPdf();
    let p12Buffer = fs.readFileSync(constant.Certificate_Url+'certificateATT.pfx');
    var pdf = signer.sign(pdfBuffer, p12Buffer, { passphrase : constant.PASSPHRASE, asn1StrictParsing : true });
    try{
      var fpath=constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/";
      var fname ;
      // models.Institution_details.findAll({
      //   where:{
      //     user_id : user_id,
      //     app_id: appl_id
      //   }
      // }) .then(function(resultset){
      //   if(resultset && resultset[0] != undefined){
      //     if(resultset[0]['wesno'] != "" && resultset[0]['wesno'] != undefined && resultset[0]['wesno'].length != 0){
      //       fname= doc_type+"_"+resultset[0]['wesno']+"-"+count+".pdf";
      //       // logger.verbose("@1 " + resultset[0]['wesno'] + " filename " + resultset[0]['wesno']+"-"+count)
      //     }else if (resultset[0]['cesno'] != "" && resultset[0]['cesno'] != undefined && resultset[0]['cesno'].length != 0){
      //       fname= doc_type+"_"+resultset[0]['cesno']+"-"+count+".pdf";
      //       // logger.verbose("@2 "+ resultset[0]['cesno'])
      //     }else if (resultset[0]['iqasno'] != "" && resultset[0]['iqasno'] != undefined && resultset[0]['iqasno'].length != 0) {
      //       fname= doc_type+"_"+resultset[0]['iqasno']+"-"+count+".pdf";
      //       // logger.verbose("@3")
      //     }else if(resultset[0]['eduperno'] != "" && resultset[0]['eduperno'] != undefined && resultset[0]['eduperno'].length != 0){
      //       fname= doc_type+"_"+resultset[0]['eduperno']+"-"+count+".pdf";
      //       // logger.verbose("@4")
      //     }else if(resultset[0]['icasno'] != "" && resultset[0]['icasno'] != undefined && resultset[0]['icasno'].length != 0){
      //       fname= doc_type+"_"+resultset[0]['icasno']+"-"+count+".pdf";
      //       // logger.verbose("@5")
      //     }else if(resultset[0]['studyrefno'] != "" && resultset[0]['studyrefno'] != undefined && resultset[0]['studyrefno'].length != 0){
      //       fname= doc_type+"_"+resultset[0]['studyrefno']+"-"+count+".pdf";
      //       // logger.verbose("@6")
      //     }else if(resultset[0]['emprefno'] != "" && resultset[0]['emprefno'] != undefined && resultset[0]['emprefno'].length != 0){
      //       fname= doc_type+"_"+resultset[0]['emprefno']+"-"+count+".pdf";
      //       // logger.verbose("@7")
      //     }else if(resultset[0]['visarefno'] != "" && resultset[0]['visarefno'] != undefined && resultset[0]['visarefno'].length != 0){
      //       fname= doc_type+"_"+resultset[0]['visarefno']+"-"+count+".pdf";
      //       // logger.verbose("@8")
      //     }else {
      //       fname = appl_id+"_"+doc_type+"_"+name_pdf+"-"+count+".pdf";
      //       // logger.verbose("@default")
      //     }
      //   }else {
      //     fname = appl_id+"_"+doc_type+"_"+filename+"-"+count+".pdf";
      //   }     
      //   var fullfile = fpath+fname;
      //   //logger.debug("fullfile : "+fullfile)
      //   if (!fs.existsSync(fullfile)) {
      //     signstatus = true;
      //     var file=fs.writeFileSync(fullfile,pdf, function (err) {
      //       if (err) {
      //         callback(err);
      //       }
      //     });
      //     fs.exists(fullfile, function (exists) {
      //       if (exists) {
      //         // models.Institution_details.find({
      //         //   where :{
      //         //     app_id  :appl_id
      //         //   }
      //         // }).then(function(details){ 
      //         //   if(details.type == "Educational credential evaluators WES"){  
      //         //     fileTransferWes(user_id,appl_id,fullfile);
      //         //   }else {
      //         //   }
      //         // })
      //         //  compress(fullfile,fname);
      //       }
      //     })
      //     models.Emailed_Docs.find({
      //       where : {
      //         filename : fname,
      //         transcript_id: transcript_id,
      //         app_id:appl_id,
      //       }
      //     }).then(function(emailedDoc){
      //       if(emailedDoc){

      //       }else{
      //         models.Emailed_Docs.create({
      //       filename : fname,
      //       doc_type : doc_type,
      //       category : category,
      //       user_id: user_id,
      //       transcript_id: transcript_id,
      //       marklist_id : marksheet_id,
      //       app_id:appl_id,
      //       curriculum_id : curriculum_id
      //         }).then((result)=>{
      //           // logger.debug(" result : "+JSON.stringify(result))
      //         })
      //       }
      //     })
      //   }else{
      //     signstatus = true;
      //   }
      // })
      fname = doc_type+"_"+filename+"-"+".pdf";
      var fullfile = fpath+fname;
        //logger.debug("fullfile : "+fullfile)
        if (!fs.existsSync(fullfile)) {
          signstatus = true;
          var file=fs.writeFileSync(fullfile,pdf, function (err) {
            if (err) {
              callback(err);
            }
          });
          models.Emailed_Docs.find({
            where : {
              filename : fname,
              competency_id: competency_id,
              app_id:appl_id,
            }
          }).then(function(emailedDoc){
            if(emailedDoc){

            }else{
              models.Emailed_Docs.create({
            filename : fname,
            doc_type : doc_type,
            category : category,
            user_id: user_id,
            transcript_id: transcript_id,
            marklist_id : marksheet_id,
            app_id:appl_id,
            curriculum_id : curriculum_id,
            gradToPer_id : letter_id,
            competency_id :competency_id
              }).then((result)=>{
                // logger.debug(" result : "+JSON.stringify(result))
              })
            }
          })
        }else{
          signstatus = true;
        }
      callback();
    }catch(error){
      signstatus = false;
      logger.error("There is problem in generating signed pdf."+error);
      callback(error);
    }
  }
  action();
  // return new Promise(resolve => {
  //   setTimeout(() => {
  //     resolve(signstatus);
  //   }, 5000);
  // });
}

module.exports.merge_uploaded = async function(inputString,outputfile,callback){
  var command = "pdfunite "+inputString+ " " +outputfile;
  const pdfunite = exec(command, function (error, stdout, stderr) {
      if (error) {
        logger.error(error.stack);
        logger.error('Error code: '+error.code);
        logger.error('Signal received: '+error.signal);
      }else{
         callback();
      }
      logger.debug('Child Process STDOUT: '+stdout);
      logger.error('Child Process STDERR: '+stderr);
    });

    pdfunite.on('exit', function (code) {
      logger.debug('Child process exited with exit code '+code);
    });
},

module.exports.merge = async function (app_id,user_id, mergefilesString){
  logger.info("merge called for application no : "+app_id)
  var outputfile = constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+app_id+"_Merge.pdf" ;
  var inputdirectory = constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/*";
  var command = "pdfunite "+mergefilesString+ " " +outputfile;
  const pdfunite = exec(command, function (error, stdout, stderr) {
    if (error) {
      logger.error(error.stack);
      logger.error('Error code: '+error.code);
      logger.error('Signal received: '+error.signal);
    }else{
      models.Emailed_Docs.find({
        where:{
          filename : app_id+"_Merge.pdf",
          doc_type : 'merged',
          app_id : app_id
        }
      }).then((result)=>{
        if(result){
          logger.info("file created @ "+constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+app_id+"_Merge.pdf")
          // models.Institution_details.find({
          //   where:{
          //     user_id : user_id
          //   },
          //   attributes:[
          //     'wesno'
          //   ]
          // }).then((stu)=>{
          //   unirest('POST', constant.urlAuthString)
          //   .headers({
          //     'Content-Type': 'application/json',
          //     'Cookie': '__cfduid=de30535dd8b92c6d12074d60ef2df6cdd1592205580'
          //   })
          //   .send(JSON.stringify(obj))
          //   .end(function (res) { 
          //     if (res.error) throw new Error(res.error); 
          //     var parsed = JSON.parse(res.raw_body);
          //     //Add 7 digit wes code instead of 123
          //     var wesid = stu['wesno'].slice(3, 10);
          //     var req = unirest('POST', constant.urlFileUpload + '/' + wesid)
          //     .headers({
          //       'Content-Type': 'multipart/form-data',
          //       'Authorization': 'Bearer '+parsed.token
          //     })//give the location of the file to upload
          //     .attach('file', constant.signedFileUrl + user_id + '/' + app_id + '_Merge.pdf')
          //     .end(function (res) {
          //       if (res.error) throw new Error(res.error);
          //       if(JSON.parse(res['raw_body'])['status']=='Accepted'){
          //         models.Institution_details.update({
          //           wesupload:new Date().toISOString().slice(0,10)},
          //           {
          //             where :{
          //              [Op.and]:[{
          //                user_id:user_id
          //               },
          //               {
          //                 type:'Educational credential evaluators WES'
          //               }]
          //           }
          //         }).then((err,updated)=>{
          //           if(err){
          //             logger.error(err)
          //           }
          //           functions.socketnotification('Wes file Uploaded','Wes file uploaded to wes server succesfully',user_id,'student');
          //         })
          //       }
          //     });
          //   });
          // })  
        }else{
          models.Emailed_Docs.create({
            filename : app_id+"_Merge.pdf",
            doc_type : 'merged',
            app_id : app_id
          }).then((result)=>{
            if(result){
              logger.info("file created @ "+constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+app_id+"_Merge.pdf")
            //   models.Institution_details.find({
            //   where:{
            //     user_id : user_id
            //   },
            //   attributes:[
            //    'wesno'
            //   ]
            // }).then((stu)=>{
            //   unirest('POST', constant.urlAuthString)
            //   .headers({
            //    'Content-Type': 'application/json',
            //     'Cookie': '__cfduid=de30535dd8b92c6d12074d60ef2df6cdd1592205580'
            //   })
            //   .send(JSON.stringify(obj))
            //   .end(function (res) { 
            //     if (res.error) throw new Error(res.error); 
            //       var parsed = JSON.parse(res.raw_body);
            //       //Add 7 digit wes code instead of 123
            //       var wesid = stu['wesno'].slice(3, 10);
            //       var req = unirest('POST', constant.urlFileUpload + '/' + wesid)
            //       .headers({
            //         'Content-Type': 'multipart/form-data',
            //         'Authorization': 'Bearer '+parsed.token
            //       })//give the location of the file to upload
            //       .attach('file', constant.signedFileUrl + user_id + '/' + app_id + '_Merge.pdf')
            //       .end(function (res) {
            //         if (res.error) throw new Error(res.error);
            //         if(JSON.parse(res['raw_body'])['status']=='Accepted'){
            //           models.Institution_details.update(
            //             {wesupload:new Date().toISOString().slice(0,10)},
            //             {
            //               where :{
            //                [Op.and]:[{
            //                  user_id:user_id
            //                 },
            //                 {
            //                   type:'Educational credential evaluators WES'
            //                 }]
            //               }
            //             }
            //           ).then((err,updated)=>{
            //             if(err){
            //               logger.error(err)
            //             }
            //            functions.socketnotification('Wes file Uploaded','Wes file uploaded to wes server succesfully',user_id,'student');
            //           })
            //         }
            //       });
            //     });
            //   })  
            }
          })
        }
      })
    }
    logger.debug('Child Process STDOUT: '+stdout);
    logger.error('Child Process STDERR: '+stderr);
  });

  pdfunite.on('exit', function (code) {
    logger.debug('Child process exited with exit code '+code);
  });
}

module.exports.merge = async function (app_id,user_id, mergefilesString){
  logger.info("merge called for application no : "+app_id)
  var outputfile = constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+app_id+"_Merge.pdf" ;
  var inputdirectory = constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/*";
  var command = "pdfunite "+mergefilesString+ " " +outputfile;
  const pdfunite = exec(command, function (error, stdout, stderr) {
    if (error) {
      logger.error(error.stack);
      logger.error('Error code: '+error.code);
      logger.error('Signal received: '+error.signal);
    }else{
      models.Emailed_Docs.find({
        where:{
          filename : app_id+"_Merge.pdf",
          doc_type : 'merged',
          app_id : app_id
        }
      }).then((result)=>{
        if(result){
          logger.info("file created @ "+constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+app_id+"_Merge.pdf")
          // models.Institution_details.find({
          //   where:{
          //     user_id : user_id
          //   },
          //   attributes:[
          //     'wesno'
          //   ]
          // }).then((stu)=>{
          //   unirest('POST', constant.urlAuthString)
          //   .headers({
          //     'Content-Type': 'application/json',
          //     'Cookie': '__cfduid=de30535dd8b92c6d12074d60ef2df6cdd1592205580'
          //   })
          //   .send(JSON.stringify(obj))
          //   .end(function (res) { 
          //     if (res.error) throw new Error(res.error); 
          //     var parsed = JSON.parse(res.raw_body);
          //     //Add 7 digit wes code instead of 123
          //     var wesid = stu['wesno'].slice(3, 10);
          //     var req = unirest('POST', constant.urlFileUpload + '/' + wesid)
          //     .headers({
          //       'Content-Type': 'multipart/form-data',
          //       'Authorization': 'Bearer '+parsed.token
          //     })//give the location of the file to upload
          //     .attach('file', constant.signedFileUrl + user_id + '/' + app_id + '_Merge.pdf')
          //     .end(function (res) {
          //       if (res.error) throw new Error(res.error);
          //       if(JSON.parse(res['raw_body'])['status']=='Accepted'){
          //         models.Institution_details.update({
          //           wesupload:new Date().toISOString().slice(0,10)},
          //           {
          //             where :{
          //              [Op.and]:[{
          //                user_id:user_id
          //               },
          //               {
          //                 type:'Educational credential evaluators WES'
          //               }]
          //           }
          //         }).then((err,updated)=>{
          //           if(err){
          //             logger.error(err)
          //           }
          //           functions.socketnotification('Wes file Uploaded','Wes file uploaded to wes server succesfully',user_id,'student');
          //         })
          //       }
          //     });
          //   });
          // })  
        }else{
          models.Emailed_Docs.create({
            filename : app_id+"_Merge.pdf",
            doc_type : 'merged',
            app_id : app_id
          }).then((result)=>{
            if(result){
              logger.info("file created @ "+constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+app_id+"_Merge.pdf")
            //   models.Institution_details.find({
            //   where:{
            //     user_id : user_id
            //   },
            //   attributes:[
            //    'wesno'
            //   ]
            // }).then((stu)=>{
            //   unirest('POST', constant.urlAuthString)
            //   .headers({
            //    'Content-Type': 'application/json',
            //     'Cookie': '__cfduid=de30535dd8b92c6d12074d60ef2df6cdd1592205580'
            //   })
            //   .send(JSON.stringify(obj))
            //   .end(function (res) { 
            //     if (res.error) throw new Error(res.error); 
            //       var parsed = JSON.parse(res.raw_body);
            //       //Add 7 digit wes code instead of 123
            //       var wesid = stu['wesno'].slice(3, 10);
            //       var req = unirest('POST', constant.urlFileUpload + '/' + wesid)
            //       .headers({
            //         'Content-Type': 'multipart/form-data',
            //         'Authorization': 'Bearer '+parsed.token
            //       })//give the location of the file to upload
            //       .attach('file', constant.signedFileUrl + user_id + '/' + app_id + '_Merge.pdf')
            //       .end(function (res) {
            //         if (res.error) throw new Error(res.error);
            //         if(JSON.parse(res['raw_body'])['status']=='Accepted'){
            //           models.Institution_details.update(
            //             {wesupload:new Date().toISOString().slice(0,10)},
            //             {
            //               where :{
            //                [Op.and]:[{
            //                  user_id:user_id
            //                 },
            //                 {
            //                   type:'Educational credential evaluators WES'
            //                 }]
            //               }
            //             }
            //           ).then((err,updated)=>{
            //             if(err){
            //               logger.error(err)
            //             }
            //            functions.socketnotification('Wes file Uploaded','Wes file uploaded to wes server succesfully',user_id,'student');
            //           })
            //         }
            //       });
            //     });
            //   })  
            }
          })
        }
      })
    }
    logger.debug('Child Process STDOUT: '+stdout);
    logger.error('Child Process STDERR: '+stderr);
  });

  pdfunite.on('exit', function (code) {
    logger.debug('Child process exited with exit code '+code);
  });
}


module.exports.merge_All = async function (app_id,user_id, mergefilesString){
  logger.info("merge called merge_All : "+app_id)
  var outputfile = constant.FILE_LOCATION+"public/upload/documents"+user_id+"/"+app_id+"_MergeAll.pdf" ;
  var inputdirectory = constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/*";
  var command = "pdfunite "+mergefilesString+ " " +outputfile;
  const pdfunite = exec(command, function (error, stdout, stderr) {
    if (error) {
      logger.error(error.stack);
      logger.error('Error code: '+error.code);
      logger.error('Signal received: '+error.signal);
    }else{
     
    }
    logger.debug('Child Process STDOUT: '+stdout);
    logger.error('Child Process STDERR: '+stderr);
  });

  pdfunite.on('exit', function (code) {
    logger.debug('Child process exited with exit code '+code);
  });
}
module.exports.mergenotforprint = async function (app_id,user_id, mergefilesString){
  logger.info("_Merge_notforprint called for application no : "+app_id)
  var outputfile = constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+app_id+"_Merge_notforprint.pdf" ;
  var inputdirectory = constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/*";
  var command = "pdfunite "+mergefilesString+ " " +outputfile;
  const pdfunite = exec(command, function (error, stdout, stderr) {
    if (error) {
      logger.error(error.stack);
      logger.error('Error code: '+error.code);
      logger.error('Signal received: '+error.signal);
    }else{
      models.Emailed_Docs.find({
        where:{
          filename : app_id+"_Merge_notforprint.pdf",
          doc_type : 'merged',
          app_id : app_id
        }
      }).then((result)=>{
        if(result){
          logger.info("file created @ "+constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+app_id+"_Merge_notforprint.pdf")
          // models.Institution_details.find({
          //   where:{
          //     user_id : user_id
          //   },
          //   attributes:[
          //     'wesno'
          //   ]
          // }).then((stu)=>{
          //   unirest('POST', constant.urlAuthString)
          //   .headers({
          //     'Content-Type': 'application/json',
          //     'Cookie': '__cfduid=de30535dd8b92c6d12074d60ef2df6cdd1592205580'
          //   })
          //   .send(JSON.stringify(obj))
          //   .end(function (res) { 
          //     if (res.error) throw new Error(res.error); 
          //     var parsed = JSON.parse(res.raw_body);
          //     //Add 7 digit wes code instead of 123
          //     var wesid = stu['wesno'].slice(3, 10);
          //     var req = unirest('POST', constant.urlFileUpload + '/' + wesid)
          //     .headers({
          //       'Content-Type': 'multipart/form-data',
          //       'Authorization': 'Bearer '+parsed.token
          //     })//give the location of the file to upload
          //     .attach('file', constant.signedFileUrl + user_id + '/' + app_id + '_Merge.pdf')
          //     .end(function (res) {
          //       if (res.error) throw new Error(res.error);
          //       if(JSON.parse(res['raw_body'])['status']=='Accepted'){
          //         models.Institution_details.update({
          //           wesupload:new Date().toISOString().slice(0,10)},
          //           {
          //             where :{
          //              [Op.and]:[{
          //                user_id:user_id
          //               },
          //               {
          //                 type:'Educational credential evaluators WES'
          //               }]
          //           }
          //         }).then((err,updated)=>{
          //           if(err){
          //             logger.error(err)
          //           }
          //           functions.socketnotification('Wes file Uploaded','Wes file uploaded to wes server succesfully',user_id,'student');
          //         })
          //       }
          //     });
          //   });
          // })  
        }else{
          models.Emailed_Docs.create({
            filename : app_id+"_Merge_notforprint.pdf",
            doc_type : 'merged',
            app_id : app_id
          }).then((result)=>{
            if(result){
              logger.info("file created @ "+constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+app_id+"_Merge_notforprint.pdf")
            //   models.Institution_details.find({
            //   where:{
            //     user_id : user_id
            //   },
            //   attributes:[
            //    'wesno'
            //   ]
            // }).then((stu)=>{
            //   unirest('POST', constant.urlAuthString)
            //   .headers({
            //    'Content-Type': 'application/json',
            //     'Cookie': '__cfduid=de30535dd8b92c6d12074d60ef2df6cdd1592205580'
            //   })
            //   .send(JSON.stringify(obj))
            //   .end(function (res) { 
            //     if (res.error) throw new Error(res.error); 
            //       var parsed = JSON.parse(res.raw_body);
            //       //Add 7 digit wes code instead of 123
            //       var wesid = stu['wesno'].slice(3, 10);
            //       var req = unirest('POST', constant.urlFileUpload + '/' + wesid)
            //       .headers({
            //         'Content-Type': 'multipart/form-data',
            //         'Authorization': 'Bearer '+parsed.token
            //       })//give the location of the file to upload
            //       .attach('file', constant.signedFileUrl + user_id + '/' + app_id + '_Merge.pdf')
            //       .end(function (res) {
            //         if (res.error) throw new Error(res.error);
            //         if(JSON.parse(res['raw_body'])['status']=='Accepted'){
            //           models.Institution_details.update(
            //             {wesupload:new Date().toISOString().slice(0,10)},
            //             {
            //               where :{
            //                [Op.and]:[{
            //                  user_id:user_id
            //                 },
            //                 {
            //                   type:'Educational credential evaluators WES'
            //                 }]
            //               }
            //             }
            //           ).then((err,updated)=>{
            //             if(err){
            //               logger.error(err)
            //             }
            //            functions.socketnotification('Wes file Uploaded','Wes file uploaded to wes server succesfully',user_id,'student');
            //           })
            //         }
            //       });
            //     });
            //   })  
            }
          })
        }
      })
    }
    logger.debug('Child Process STDOUT: '+stdout);
    logger.error('Child Process STDERR: '+stderr);
  });

  pdfunite.on('exit', function (code) {
    logger.debug('Child process exited with exit code '+code);
  });
}

module.exports.curriculum_merge =    async function (appl_id, user_id, curriculum_id,doc_type,filename, inputdirectory,count){
  logger.info("curriculum_merge called for application no : "+appl_id);
  var fname;
  models.Institution_details.findAll({
    where:
    {
      user_id : user_id,
      app_id: appl_id
     }
    }) .then(function(resultset){
    
    //  if(resultset && resultset[0] != undefined){
    //    logger.error(JSON.stringify(resultset[0]))
    //    if(resultset[0]['wesno'] != "" &&  
    //    resultset[0]['wesno'] != undefined && 
    //    resultset[0]['wesno'].length != 0){
    //      fname= doc_type+"_"+resultset[0]['wesno']+"-"+count+".pdf";
    //     logger.verbose("@1 " + resultset[0]['wesno'] + " filename " + resultset[0]['wesno']+"-"+count)
    //    }else if (resultset[0]['cesno'] != ""&&  
    //    resultset[0]['cesno'] != undefined && 
    //    resultset[0]['cesno'].length != 0){
    //     fname= doc_type+"_"+resultset[0]['cesno']+"-"+count+".pdf";
    //     logger.verbose("@2 "+ resultset[0]['cesno'])
    //    }else if (resultset[0]['iqasno'] != ""&&  
    //    resultset[0]['iqasno'] != undefined && 
    //    resultset[0]['iqasno'].length != 0) {
    //     fname= doc_type+"_"+resultset[0]['iqasno']+"-"+count+".pdf";
    //     logger.verbose("@3")
    //    }else if(resultset[0]['eduperno'] != ""&&  
    //    resultset[0]['eduperno'] != undefined && 
    //    resultset[0]['eduperno'].length != 0){
    //     fname= doc_type+"_"+resultset[0]['eduperno']+"-"+count+".pdf";
    //     logger.verbose("@4")
    //    }else if(resultset[0]['icasno'] != ""&&  
    //    resultset[0]['icasno'] != undefined && 
    //    resultset[0]['icasno'].length != 0){
    //     fname= doc_type+"_"+resultset[0]['icasno']+"-"+count+".pdf";
    //     logger.verbose("@5")
    //    }else if(resultset[0]['studyrefno'] != ""&&  
    //    resultset[0]['studyrefno'] != undefined && 
    //    resultset[0]['studyrefno'].length != 0){
    //     fname= doc_type+"_"+resultset[0]['studyrefno']+"-"+count+".pdf";
    //     logger.verbose("@6")
    //    }else if(resultset[0]['emprefno'] != ""&&  
    //    resultset[0]['emprefno'] != undefined && 
    //    resultset[0]['emprefno'].length != 0){
    //     fname= doc_type+"_"+resultset[0]['emprefno']+"-"+count+".pdf";
    //     logger.verbose("@7")
    //    }else if(resultset[0]['visarefno'] != ""&&  
    //    resultset[0]['visarefno'] != undefined && 
    //    resultset[0]['visarefno'].length != 0){
    //     fname= doc_type+"_"+resultset[0]['visarefno']+"-"+count+".pdf";
    //     logger.verbose("@8")
    //    }else {
    //     fname = appl_id+"_"+doc_type+"_"+filename+"-"+count+".pdf";
    //     logger.verbose("@default")
    //    }
    //   } else {
        fname = doc_type+"_"+filename+".pdf";
    //  }    
       
    
   var outputfile = constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+fname ;
  // var inputdirectory = constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/*";
  var command = "pdfunite "+inputdirectory+ " " +outputfile;
  const pdfunite = exec(command, function (error, stdout, stderr) {
    if (error) {
      logger.error(error.stack);
      logger.error('Error code: '+error.code);
      logger.error('Signal received: '+error.signal);
    }else{
      models.Emailed_Docs.find({
        where : {
          filename : fname,
          curriculum_id: curriculum_id,
          app_id:appl_id,
        }
      }).then(function(emailedDoc){
        if(emailedDoc){

        }else{
          models.Emailed_Docs.create({
            filename : fname,
            doc_type : doc_type,
            category : "Curriculum",
            user_id: user_id,
            transcript_id: null,
            marklist_id : null,
            app_id:appl_id,
            curriculum_id : curriculum_id
          }).then((result)=>{
            logger.debug(" result : "+JSON.stringify(result))
          })
        }
      })
    }
    logger.debug('Child Process STDOUT: '+stdout);
    logger.error('Child Process STDERR: '+stderr);
  });

  pdfunite.on('exit', function (code) {
    logger.debug('Child process exited with exit code '+code);
  });

});
    
}

module.exports.passpro = async function(filename,file_loc,appl_id,ran_string){
  var propdf;
    var name_pdf=path.parse(filename).name
    var options = {
        keyLength: 40,
        password: ran_string
      };
     qpdf.encrypt(file_loc, options, function(err, data) {
          if (err) {
            logger.error(err);
            propdf=false;
          } else {
            if (!fs.existsSync(constant.FILE_LOCATION+"public/protected_pdf/"))//!fs.existsSync
            {
                  fs.mkdirSync(constant.FILE_LOCATION+"public/protected_pdf/", { recursive: true });//fs.writeFileSync
            }
              try{
                  if(!(fs.existsSync(constant.FILE_LOCATION+"public/protected_pdf/"+name_pdf+".pdf"))){
                    const writeStream = fs.createWriteStream(constant.FILE_LOCATION+"public/protected_pdf/"+name_pdf+".pdf");
                    data.pipe(writeStream);
                    propdf=true;
                  }else{
                    propdf=true;
                      logger.debug("password protected file is already generated of application id "+appl_id);
                  }
              }catch(error){
                propdf=false;
                  logger.debug("Problem arises while generating password protected signed pdf");
              }
          }
        })
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(propdf);
          }, 2000);
        });
}

module.exports.curriculumsignedpdf = async function(filename, user_id, appl_id, file_loc, signstatus, doc_type,count, outputdirectory){
  logger.debug("curriculumsignedpdf called for "+filename+ " & file_loc==>"+file_loc);
var signstatus;
     var name_pdf = filename;
      const createPdf = (params = {
         placeholder: { reason : 'Digital signed by University Of Gujarat' },
       }) => new Promise((resolve) => {
         const pdf = new PDFDocument({
             autoFirstPage: true,
             size: 'A4',
             layout: 'portrait',
             bufferPages: true,
             margins : { 
               top: 72, 
               bottom: 20,
               left: 72,
               right: 72
           },
           info: {
               Author: 'Gujarat University',
               Subject: 'Digital Signature', 
               CreationDate: moment.utc(Date.now()).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'), 
           }
         });
         pdf.info.CreationDate = '';
         pdf.fillColor('#333').fontSize(25).moveDown().text(params.text);
     
         const pdfChunks = [];
         pdf.on('data', (data) => {
             pdfChunks.push(data);
         });
     
         pdf.image(file_loc,0,0, {
           size: 'A4',
           align: 'center',
           width: 600,
           height:pdf.page.height - 90,
           note:'Digitally signed by University Of Gujarat',
       }).moveDown(0.2);
       pdf.moveTo(20, pdf.page.height - 92) 
       .lineTo( pdf.page.width-20, pdf.page.height - 92) 
       .dash(10, {space: 0}) 
       .stroke() ;
       pdf.moveTo(20, pdf.page.height - 94)  
       .lineTo(pdf.page.width-20, pdf.page.height - 94)  
       .dash(10, {space: 0}) 
       .stroke() ;
        
      pdf.image(constant.FILE_LOCATION+'public/upload/profile_pic/gu_Stamp.png',300,755,{fit: [85, 85], align: 'center'});
      pdf.image(constant.FILE_LOCATION+'public/upload/profile_pic/sample_signature.jpeg',430,755,{width: 130,height: 80, align: 'center'});
      
      pdf.on('end', () => {
               resolve(Buffer.concat(pdfChunks));
       });
         
         const refs = addSignaturePlaceholder({
             pdf,
             reason: 'Approved',
             ...params.placeholder,
         });
     
         Object.keys(refs).forEach(key => refs[key].end());
         pdf.end();
     });
       
       const action = async () => {
         logger.debug("action called")
         let pdfBuffer = await createPdf();
         let p12Buffer = fs.readFileSync(constant.Certificate_Url+'certificateATT.pfx');
         var pdf = signer.sign(pdfBuffer, p12Buffer, { passphrase : constant.PASSPHRASE, asn1StrictParsing : true });
          try{
            var fpath = outputdirectory; //constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/";
            var fname ;
            fname = name_pdf+"_"+count+".pdf";   
            var fullfile = fpath+fname;
           if (!fs.existsSync(fullfile)) {
              signstatus = true;
              var file=fs.writeFileSync(fullfile,pdf);
            
            }else{
              signstatus = true;
            }
         
          }catch(error){
            signstatus = false;
            logger.error("There is problem in generating curriculum signed pdf."+error);
          }
       }
     
        action();
  
       return new Promise(resolve => {
          setTimeout(() => {
              
            resolve(signstatus);
          }, 5000);
        });
} 


module.exports.curriculumsignedpdf_new = async function(filename, user_id, appl_id, file_loc, signstatus, doc_type,count, outputdirectory,callback){
  logger.debug("curriculumsignedpdf called for "+filename+ " & file_loc==>"+file_loc);
  var signstatus;
  var name_pdf = filename;
  const createPdf = (params = {
    placeholder: { reason : 'Digital signed by University Of Gujarat' },
  }) => new Promise((resolve) => {
    const pdf = new PDFDocument({
      autoFirstPage: true,
      size: 'A4',
      layout: 'portrait',
      bufferPages: true,
      margins : { 
        top: 72, 
        bottom: 20,
        left: 72,
        right: 72
      },
      info: {
        Author: 'Gujarat University',
        Subject: 'Digital Signature', 
        CreationDate: moment.utc(Date.now()).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'), 
      }
    });
    pdf.info.CreationDate = '';
    pdf.fillColor('#333').fontSize(25).moveDown().text(params.text);
    const pdfChunks = [];
    pdf.on('data', (data) => {
      pdfChunks.push(data);
    });
    pdf.image(file_loc,0,0, {
      size: 'A4',
      align: 'center',
      width: 600,
      height:pdf.page.height - 90,
      note:'Digitally signed by University Of Gujarat',
    }).moveDown(0.2);
    pdf.moveTo(20, pdf.page.height - 92) 
    .lineTo( pdf.page.width-20, pdf.page.height - 92) 
    .dash(10, {space: 0}) 
    .stroke() ;
    pdf.moveTo(20, pdf.page.height - 94)  
    .lineTo(pdf.page.width-20, pdf.page.height - 94)  
    .dash(10, {space: 0}) 
    .stroke() ;
    pdf.image(constant.FILE_LOCATION+'public/upload/profile_pic/gu_Stamp.png',300,755,{fit: [85, 85], align: 'center'});
    pdf.image(constant.FILE_LOCATION+'public/upload/profile_pic/sample_signature.jpeg',430,755,{width: 130,height: 80, align: 'center'});
    pdf.on('end', () => {
      resolve(Buffer.concat(pdfChunks));
    });
    const refs = addSignaturePlaceholder({
      pdf,
      reason: 'Approved',
      ...params.placeholder,
    });
    Object.keys(refs).forEach(key => refs[key].end());
    pdf.end();
  });
  const action = async () => {
    logger.debug("action called")
    let pdfBuffer = await createPdf();
    let p12Buffer = fs.readFileSync(constant.Certificate_Url+'certificateATT.pfx');
    var pdf = signer.sign(pdfBuffer, p12Buffer, { passphrase : constant.PASSPHRASE, asn1StrictParsing : true });
    try{
      var fpath = outputdirectory; //constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/";
      var fname ;
      fname = name_pdf+"_"+count+".pdf";   
      var fullfile = fpath+fname;
      if (!fs.existsSync(fullfile)) {
        signstatus = true;
        var file=fs.writeFileSync(fullfile,pdf);
        callback();
      }else{
        signstatus = true;
        callback();
      }
    }catch(error){
      signstatus = false;
      logger.error("There is problem in generating curriculum signed pdf."+error);
      callback("There is problem in generating curriculum signed pdf.");
    }
  }
  action();
  // return new Promise(resolve => {
  //   setTimeout(() => {
  //     resolve(signstatus);
  //   }, 5000);
  // });
} 

async function compress(inputfile,fname){
  try{
    const CloudConvert = require('cloudconvert');
    const cloudConvert = new CloudConvert(constant.CCAPIKEY);
    var job = await cloudConvert.jobs.create({
          "tasks": {
              "upload-my-file": {
                  "operation": "import/upload"
              },
              "optimize-my-file": {
                  "operation": "optimize",
                  "input": [
                      "upload-my-file"
                  ],
                  "input_format": "pdf",
                  "engine": "3heights",
                  "profile": "web",
                  "engine_version": "6.2",
                  "filename": fname
              },
              "export-my-file": {
                  "operation": "export/url",
                  "input": [
                      "optimize-my-file"
                  ],
                  "inline": false,
                  "archive_multiple_files": false
              }
          }
      });
     // logger.debug("job : "+JSON.stringify(job));
      logger.debug("job.id :"+job.id);
      //Upload
      const uploadTask = job.tasks.filter(task => task.name === 'upload-my-file')[0];
      const inpFile = fs.createReadStream(inputfile);       
      await cloudConvert.tasks.upload(uploadTask, inpFile);

      //Optimize
      const optimizeTask = job.tasks.filter(task => task.name === 'optimize-my-file')[0];
     // logger.debug("optimizeTask :"+JSON.stringify(optimizeTask))
    
       //Download
      
      job = await cloudConvert.jobs.wait(job.id); // Wait for job completion
      const exportTask = job.tasks.filter(task => task.operation === 'export/url' && task.status === 'finished')[0];
      logger.debug("exportTask :"+JSON.stringify(exportTask));
      const file = exportTask.result.files[0];
      var writeStream = fs.createWriteStream(inputfile);
      https.get(file.url, function(response) {
      response.pipe(writeStream);
      });    

      await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
      });

  }catch(exception){
      logger.error(exception)
  }}

function fileTransferWes(user_id,appl_id,fullfile){
  models.Institution_details.find({
    where:{
      [Op.and]:[{
        user_id:user_id
       },
       {
         type:'Educational credential evaluators WES'
       }]
    },
    attributes:[
      'wesno'
    ]
  }).then((stu)=>{
     unirest('POST', constant.urlAuthString)
    .headers({
      'Content-Type': 'application/json',
      'Cookie': '__cfduid=de30535dd8b92c6d12074d60ef2df6cdd1592205580'
    })
    .send(JSON.stringify(obj))
    .end(function (res) { 
      var wesid = stu['wesno'].slice(3, 10);
      if (res.error) throw new Error(res.error); 
      var parsed = JSON.parse(res.raw_body);
      unirest('GET', 'https://testeuploads.wes.org/api/v2/applicantinfo/'+wesid)
      .headers({
        'Authorization': 'Bearer '+ parsed.token
      }).end(function (res) {
        if (res.error) {
      models.Institution_details.update(
            {wesrecord:JSON.parse(res['raw_body'])['title']},
              {
                where :{
               [Op.and]:[{
                 user_id:user_id
                },
                {
                  type:'Educational credential evaluators WES'
                }]
            }
        }).then((err,update)=>{
          if(err){
            logger.error(err);
          }
        })
         throw new Error(res.error)
        }; 
    if(JSON.parse(res['raw_body'])['lastName']!=undefined && JSON.parse(res['raw_body'])['firstName']!=undefined ){
     //Add 7 digit wes code instead of 123
      var wesid = stu['wesno'].slice(3, 10);
    var req = unirest('POST', constant.urlFileUpload + '/' + wesid)
     .headers({
      'Content-Type': 'multipart/form-data',
      'Authorization': 'Bearer '+parsed.token
      })//give the location of the file to upload
    .attach('file', fullfile)
    .end(function (res) {
       logger.debug(res['raw_body']);
      models.Wes_Records.create({
        userId:user_id,
        appl_id:appl_id,
        fileName:JSON.parse(res['raw_body'])['fileName'] ,
        reference_no :JSON.parse(res['raw_body'])['id'] ,
        status:JSON.parse(res['raw_body'])['status'],
        wesnumber:'GU-'+JSON.parse(res['raw_body'])['referenceNumber']
      }).then((userCreated)=>{
				if(userCreated){
					// res.status(200).json({
					// 	message:'data saved successfully!!!'
					// })
				}
			})
      if (res.error){ 
        var wesid = stu['wesno'].slice(3, 10);
        models.Wes_Records.create({
          userId:user_id,
          appl_id:appl_id,
          fileName:'' ,
          reference_no :'' ,
          status:'File is too big.Only 50mb is allowed.',
          wesnumber:'GU-'+wesid 
        }).then((userCreated)=>{
          if(userCreated){
            // res.status(200).json({
            // 	message:'data saved successfully!!!'
            // })
          }
        })
        throw new Error(res.error)};
      if(JSON.parse(res['raw_body'])['status']=='Accepted'){
        models.Institution_details.update(
          {wesupload:new Date().toISOString().slice(0,10)},
          {
            where :{
             [Op.and]:[{
               user_id:user_id
              },
              {
                type:'Educational credential evaluators WES'
              }]
          }
      }).then((err,updated)=>{
          if(err){
              logger.error(err)
          }
         functions.socketnotification('Wes file Uploaded','Wes file uploaded to wes server succesfully',user_id,'student');
      })
      }
    });
  }
    });
  });
  })  
}

module.exports.fileTransferWes1 = function(user_id,appl_id,firstName,lastName,email,fullfile,callback){
  models.Institution_details.find({
    where:{
      [Op.and]:[{
        user_id:user_id
       },
       {
        app_id : appl_id
       },
       {
         type:'Educational credential evaluators WES'
       }]
    },
    attributes:[
      'wesno'
    ]
  }).then((stu)=>{
     unirest('POST', constant.urlAuthString)
    .headers({
      'Content-Type': 'application/json',
      'Cookie': '__cfduid=de30535dd8b92c6d12074d60ef2df6cdd1592205580'
    })
    .send(JSON.stringify(obj))
    .end(function (res) { 
      var wesid = stu['wesno'].slice(3, 10);
      if (res.error){ callback("authentication error for wes"); throw new Error(res.error); } 
      var parsed = JSON.parse(res.raw_body);
      unirest('GET', 'https://testeuploads.wes.org/api/v2/applicantinfo/'+wesid)
      .headers({
        'Authorization': 'Bearer '+ parsed.token
      }).end(function (res) {
        if (res.error) {
              callback('WES No. Not Found');
        }else{
          if(JSON.parse(res['raw_body'])['lastName'].toLowerCase() == lastName.toLowerCase() || 
            JSON.parse(res['raw_body'])['firstName'].toLowerCase() == firstName.toLowerCase() || 
            JSON.parse(res['raw_body'])['email'].toLowerCase()==email.toLowerCase()){
             var wesid = stu['wesno'].slice(3, 10);
            var req = unirest('POST', constant.urlFileUpload + '/' + wesid)
            .headers({
              'Content-Type': 'multipart/form-data',
              'Authorization': 'Bearer '+parsed.token
            })//give the location of the file to upload
            .attach('file', fullfile)
            .end(function (res) {
              logger.debug(res['raw_body']);
              models.Wes_Records.create({
                userId:user_id,
                appl_id:appl_id,
                fileName:JSON.parse(res['raw_body'])['fileName'] ,
                reference_no :JSON.parse(res['raw_body'])['id'] ,
                status:JSON.parse(res['raw_body'])['status'],
                wesnumber:'GU-'+JSON.parse(res['raw_body'])['referenceNumber']
              }).then((userCreated)=>{
                if(userCreated){
                  }
              })
              if (res.error){ 
                var wesid = stu['wesno'].slice(3, 10);
                models.Wes_Records.create({
                  userId:user_id,
                  appl_id:appl_id,
                  fileName:'' ,
                  reference_no :'' ,
                  status:'File is too big.Only 50mb is allowed.',
                  wesnumber:'GU-'+wesid 
                }).then((userCreated)=>{
                  if(userCreated){
                    
                  }
                })
                throw new Error(res.error)
                callback("File is too big");
              }
              if(JSON.parse(res['raw_body'])['status']=='Accepted'){
                models.Institution_details.update(
                  {wesupload:new Date().toISOString().slice(0,10)},
                  {
                    where :{
                      [Op.and]:[{
                      user_id:user_id
                      },
                      {
                        app_id:appl_id
                        },
                      {
                        type:'Educational credential evaluators WES'
                      }]
                    }
                  }).then((err,updated)=>{
                    if(err){
                        logger.error(err)
                    }
                  functions.socketnotification('Wes file Uploaded','Wes file uploaded to wes server succesfully',user_id,'student');
                  callback();
                })
              }
            });
          }else{
            callback("Student has filled wrong Wes Details")
          }
        }
      });
    });
  })  
}

module.exports.fileTransferWes_new = function(user_id,appl_id,fullfile,callback){
  models.Institution_details.find({
    where:{
      [Op.and]:[{
        user_id:user_id
       },
       {
         type:'Educational credential evaluators WES'
       }]
    },
    attributes:[
      'wesno'
    ]
  }).then((stu)=>{
    unirest('POST', constant.urlAuthString)
    .headers({
      'Content-Type': 'application/json',
      'Cookie': '__cfduid=de30535dd8b92c6d12074d60ef2df6cdd1592205580'
    })
    .send(JSON.stringify(obj))
    .end(function (res) { 
      var wesid = stu['wesno'].slice(3, 10);
      if (res.error) throw new Error(res.error); 
      var parsed = JSON.parse(res.raw_body);
      unirest('GET', 'https://testeuploads.wes.org/api/v2/applicantinfo/'+wesid)
      .headers({
        'Authorization': 'Bearer '+ parsed.token
      }).end(function (res) {
        if (res.error) {
          models.Institution_details.update({wesrecord:JSON.parse(res['raw_body'])['title']},
          {
            where :{
              [Op.and]:[{
                user_id:user_id
              },
              {
                type:'Educational credential evaluators WES'
              }]
            }
          }).then((err,update)=>{
            if(err){
              logger.error(err);
            }
          })
          throw new Error(res.error)
          
        } 
        if(JSON.parse(res['raw_body'])['lastName']!=undefined && JSON.parse(res['raw_body'])['firstName']!=undefined ){
          //Add 7 digit wes code instead of 123
          var wesid = stu['wesno'].slice(3, 10);
          var req = unirest('POST', constant.urlFileUpload + '/' + wesid)
          .headers({
            'Content-Type': 'multipart/form-data',
            'Authorization': 'Bearer '+parsed.token
          })//give the location of the file to upload
          .attach('file', fullfile)
          .end(function (res) {
            logger.debug(res['raw_body']);
            models.Wes_Records.create({
              userId:user_id,
              appl_id:appl_id,
              fileName:JSON.parse(res['raw_body'])['fileName'] ,
              reference_no :JSON.parse(res['raw_body'])['id'] ,
              status:JSON.parse(res['raw_body'])['status'],
              wesnumber:'GU-'+JSON.parse(res['raw_body'])['referenceNumber']
            }).then((userCreated)=>{
				      if(userCreated){
					      // res.status(200).json({
					      // 	message:'data saved successfully!!!'
					      // })
			      	}
			      })
            if (res.error){ 
              var wesid = stu['wesno'].slice(3, 10);
              models.Wes_Records.create({
                userId:user_id,
                appl_id:appl_id,
                fileName:'' ,
                reference_no :'' ,
                status:'File is too big.Only 50mb is allowed.',
                wesnumber:'GU-'+wesid 
              }).then((userCreated)=>{
                if(userCreated){
                  // res.status(200).json({
                  // 	message:'data saved successfully!!!'
                  // })
                }
              })
              throw new Error(res.error)
              
            };
            if(JSON.parse(res['raw_body'])['status']=='Accepted'){
              models.Institution_details.update(
                {wesupload:new Date().toISOString().slice(0,10)},
                {
                  where :{
                    [Op.and]:[{
                    user_id:user_id
                  },
                  {
                    type:'Educational credential evaluators WES'
                  }]
                }
              }).then((err,updated)=>{
                if(err){
                  logger.error(err)
                  callback(err);
                }
                functions.socketnotification('Wes file Uploaded','Wes file uploaded to wes server succesfully',user_id,'student');
                callback();
              })
            }
          });
        }
      });
    });
  })  
}


module.exports.checkWESInfo = function(user_id,app_id,callback){
  models.Institution_details.find({
    where:{
      [Op.and]:[{
        user_id:user_id
       },
       {
        app_id : app_id
       },
       {
         type:'Educational credential evaluators WES'
       }]
    },
    attributes:[
      'wesno'
    ]
  }).then((stu)=>{
    unirest('POST', constant.urlAuthString)
    .headers({
      'Content-Type': 'application/json',
      'Cookie': '__cfduid=de30535dd8b92c6d12074d60ef2df6cdd1592205580'
    })
    .send(JSON.stringify(obj))
    .end(function (res) { 
      var wesid = stu['wesno'].slice(3, 10);
      if (res.error) throw new Error(res.error); 
      var parsed = JSON.parse(res.raw_body);
      unirest('GET', 'https://testeuploads.wes.org/api/v2/applicantinfo/'+wesid)
      .headers({
        'Authorization': 'Bearer '+ parsed.token
      }).end(function (res) {
        if (res.error) {
          models.Institution_details.update({wesrecord:JSON.parse(res['raw_body'])['title']},
          {
            where :{
              [Op.and]:[{
                user_id:user_id
              },
              {
                type:'Educational credential evaluators WES'
              }]
            }
          }).then((err,update)=>{
            if(err){
              logger.error(err);
            }
          })
          throw new Error(res.error)
          
        } else{
        var WES_data = JSON.parse(res['raw_body'])
          models.User.find({
            where :{
              id : user_id
            }
          }).then(function(user){
            var surname = user.surname.toLowerCase();
            var wes_lastname = WES_data.lastName.toLowerCase()
            if(JSON.parse(res['raw_body'])['lastName'].toLowerCase() == user.surname.toLowerCase() || JSON.parse(res['raw_body'])['email'].toLowerCase()==user.email.toLowerCase()){
            }
          })
        }
        // if(JSON.parse(res['raw_body'])['lastName']!=undefined && JSON.parse(res['raw_body'])['firstName']!=undefined ){
        //   //Add 7 digit wes code instead of 123
        //   var wesid = stu['wesno'].slice(3, 10);
        //  callback();
        // }
      });
    });
  })  
}

module.exports.pdfSigner =  async function(fileName, filePath, user_id, callback){
  logger.debug("pdfSigner "+filePath);

  const p12Buffer = fs.readFileSync(constant.FILE_LOCATION + 'pdf-signer.p12');

  var pdfBuffer = fs.readFileSync(constant.FILE_LOCATION + '/public/upload/documents/6910/EDUCATIONCERTIFICATE.pdf');
  const certPassword = 'pdfsigner';
  var fpath=constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/";
  const signedPdf = await sign(pdfBuffer, p12Buffer, certPassword, {
      reason: '2',
      email: 'priyanka@edulab.in',
      location: 'Gujarat',
      signerName: 'University Of Gujarat',
      annotationOnPages: [0, 1, 2],
      annotationAppearanceOptions: {
          signatureCoordinates: { left: 400, bottom: 500, right: 250, top: -50 },
          signatureDetails: [
              {
                  value: '',
                  fontSize: 7,
                  transformOptions: { rotate: 0, space: 1, tilt: 0, xPos: 20, yPos: 20 },
              },
              {
                  value: '',
                  fontSize: 7,
                  transformOptions: { rotate: 0, space: 1, tilt: 0, xPos: 20, yPos: 30 },
              },
          ],
          imageDetails: {
            imagePath: constant.FILE_LOCATION+'public/upload/profile_pic/gu_Stamp.png',
            transformOptions: { rotate: 0, space: 140, stretch: 10, tilt: 0, xPos: 0, yPos: 20 },
          },
          
      },
  })
   var fullfile = fpath+'first.pdf';
   if (!fs.existsSync(fullfile)) {
      fs.writeFileSync(fullfile,signedPdf)
        
      const pdfBuffer2 = fs.readFileSync(fullfile);

      const signedPdf2 = await sign(pdfBuffer2, p12Buffer, certPassword, {
          reason: '2',
          email: 'test@email.com',
          location: 'Gujarat',
          signerName: 'University Of Gujarat',
          annotationAppearanceOptions: {
            signatureCoordinates: { left: 400, bottom: 500, right: 250, top: -50 },
              signatureDetails: [{
                  value: '',
                  fontSize: 7,
                  transformOptions: { rotate: 0, space: 1, tilt: 0, xPos: 20, yPos: 20 },
              },
              {
                  value: '',
                  fontSize: 7,
                  transformOptions: { rotate: 0, space: 1, tilt: 0, xPos: 20, yPos: 30 },
              }],
              imageDetails: {
                  imagePath: constant.FILE_LOCATION+'public/upload/profile_pic/sample_signature.jpeg',
                  transformOptions: { rotate: 0, space: 140, stretch: 10, tilt: 0, xPos: 300, yPos: 20 },
              },
          },
      })
      
      var fullfile2 = fpath+fileName;
      fs.writeFileSync(fullfile2,signedPdf2)

   }
}


module.exports.pdfToImageConversion = async function(fileName,user_id,filePath,outputdirectory) {
  var pdfstatus;
  if(!fs.existsSync(outputdirectory)){
      fs.mkdirSync(outputdirectory, { recursive: true });//fs.writeFileSync
  }
  var output_file = outputdirectory  + path.parse(fileName).name;
  
  var command = "pdftoppm -jpeg " + filePath +  " " + output_file;
  const pdfToImg = exec(command, function (error, stdout, stderr) {
      if (error) {
          logger.error(error.stack);
          logger.error('Error code: of pdf to image '+error.code);
          logger.error('Signal received: '+error.signal);

      }else{
      }
      logger.debug('Child Process STDOUT: '+stdout);
      logger.error('Child Process STDERR: '+stderr);
  });
  pdfToImg.on('exit', function (code) {
      logger.debug('Child process exited with exit code '+code);
  });
}

module.exports.addAadharAndApp_id  = async function(fileName, user_id, app_id,filePath,outputdirectory,aadharNo,callback){
  var file = outputdirectory + '/' + fileName + '.pdf';
  const pdf = new PDFDocument();
  pdf.pipe(fs.createWriteStream(file));
  pdf.font(FILE_LOCATION+'public/fonts/Roboto-Regular.ttf')
  .fontSize(10)
  .text('Application Number : MDT/SY' + app_id, {
      width: pdf.page.width-150,
      align: 'right'
  });
  pdf.moveDown();
  pdf.font(FILE_LOCATION+'public/fonts/Roboto-Regular.ttf')
  .fontSize(10)
  .text('Aadhar Number : ' + aadharNo, {
      width: pdf.page.width-150,
      align: 'right'
  });
  pdf.image(filePath, 0, 160, {width: pdf.page.width, height: pdf.page.height - 200})
  pdf.moveDown();
  pdf.end();

  callback();
},
module.exports.signingDocuments = async function(filename, user_id, app_id, file_loc, name,category, outputdirectory,callback){
  const createPdf = (params = {
      placeholder: { reason : 'Digital signed by University Of Gujarat' },
  }) => new Promise((resolve) => {
      const pdf = new PDFDocument({
          autoFirstPage: true,
          size: 'A4',
          layout: 'portrait',
          bufferPages: true,
          margins : { 
              top: 72, 
              bottom: 20,
              left: 72,
              right: 72
          },
          info: {
              Author: 'Gujarat University',
              Subject: 'Digital Signature', 
              CreationDate: moment.utc(Date.now()).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
          }
      });
      pdf.info.CreationDate = '';
      pdf.fillColor('#333').fontSize(25).moveDown().text(params.text);
      const pdfChunks = [];
      pdf.on('data', (data) => {
          pdfChunks.push(data);
      });
      // pdf.image(file_loc,0,0, {
      //     size: 'A4',
      //     align: 'center',
      //     width: 600,
      //     height:pdf.page.height - 90,
      //     note:'Digitally signed by University Of Gujarat',
      // }).moveDown(0.2);

      pdf.image(file_loc,0,0, {fit:[pdf.page.width,pdf.page.height - 90],
        size: 'A4',
        // align: 'center',
        // //width: 600,
        // height:pdf.page.height - 90,
        note:'Digitally signed by Gujarat University',
    }).moveDown(0.2);


      pdf.moveTo(20, pdf.page.height - 94)  
      .lineTo(pdf.page.width-20, pdf.page.height - 94)  
      .dash(10, {space: 0}) 
      .stroke() ;

        pdf.image(constant.FILE_LOCATION +'public/upload/profile_pic/transcriptStamp.png',300,765,{width: 150,height: 80, align: 'center'});
  
      // pdf.image(constant.FILE_LOCATION+'public/upload/profile_pic/gu_Stamp.png',300,755,{fit: [85, 85], align: 'center'});
      // pdf.image(constant.FILE_LOCATION+'public/upload/profile_pic/sample_signature.jpeg',430,755,{width: 130,height: 80, align: 'center'});
      pdf.image(constant.FILE_LOCATION+'public/signedpdf/' + user_id + '/' + app_id + '_attestation_qrcode.png',30,755,{width: 110,height: 80, align: 'center'});
      pdf.on('end', () => {
          resolve(Buffer.concat(pdfChunks));
      });
      const refs = addSignaturePlaceholder({
          pdf,
          reason: 'Approved',
          ...params.placeholder,
      });
      Object.keys(refs).forEach(key => refs[key].end());
      pdf.end();
  });

  const action = async () => {
      logger.debug("action called");
      let pdfBuffer = await createPdf();
      let p12Buffer = fs.readFileSync(constant.Certificate_Url+'certificateATT.pfx');
      var pdf = signer.sign(pdfBuffer, p12Buffer, { passphrase : constant.PASSPHRASE, asn1StrictParsing : true });
      try{
          var fpath = outputdirectory; //constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/";
          var fname ;
          fname = name + "_" + filename + ".pdf";   
          var fullfile = fpath+fname;
          var file=fs.writeFileSync(fullfile,pdf);
          callback('',fname);
      }catch(error){
          logger.error("There is problem in generating signed pdf."+error);
          callback("There is problem in generating signed pdf.");
      }
  }

  action();
}
module.exports.signingDocuments_notforprint = async function(filename, user_id, app_id, file_loc, name,category, outputdirectory,callback){
  const createPdf = (params = {
      placeholder: { reason : 'Digital signed by University Of Gujarat' },
  }) => new Promise((resolve) => {
      const pdf = new PDFDocument({
          // image : constant.FILE_LOCATION+'public/upload/profile_pic/x.png',
          autoFirstPage: true,
          size: 'A4',
          layout: 'portrait',
          bufferPages: true,
          margins : { 
              top: 72, 
              bottom: 20,
              left: 72,
              right: 72
          },
          info: {
              Author: 'Gujarat University',
              Subject: 'Digital Signature', 
              CreationDate: moment.utc(Date.now()).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'), 
          }
      });
      pdf.image(constant.FILE_LOCATION+'public/profile_pic/notforprint.jpg', {
        // cover: [pdf.page.width - 100, pdf.page.height - 100],
        align: 'center',
        valign: 'center',
      });

      pdf.info.CreationDate = '';
      pdf.fillColor('#333').fontSize(25).moveDown().text(params.text);
      const pdfChunks = [];
      pdf.on('data', (data) => {
          pdfChunks.push(data);
      });
      // pdf.image(file_loc,0,0, {
      //     size: 'A4',
      //     align: 'center',
      //     width: 600,
      //     height:pdf.page.height - 90,
      //     note:'Digitally signed by University Of Gujarat',
      // }).moveDown(0.2);
      pdf.image(file_loc,0,0, {fit:[pdf.page.width,pdf.page.height - 90],
        size: 'A4',
        // align: 'center',
        // //width: 600,
        // height:pdf.page.height - 90,
        note:'Digitally signed by Gujarat University',
    }).moveDown(0.2);

      pdf.moveTo(20, pdf.page.height - 92) 
      .lineTo( pdf.page.width-20, pdf.page.height - 92)
      .dash(10, {space: 0}) 
      .stroke() ;
      pdf.moveTo(20, pdf.page.height - 94)  
      .lineTo(pdf.page.width-20, pdf.page.height - 94)
      .dash(10, {space: 0}) 
      .stroke() ;
      // pdf.image(constant.FILE_LOCATION+'public/upload/profile_pic/notforprint.jpg', 0,0, {width: pdf.page.width, height: pdf.page.height});

        pdf.image(constant.FILE_LOCATION +'public/upload/profile_pic/transcriptStamp.png',300,765,{width: 150,height: 80, align: 'center'});
   
      // else{
      //   pdf.image(constant.FILE_LOCATION+'public/upload/profile_pic/marksheetStamp.png',300,765,{fit: [85, 85], align: 'center'});
      // }
      // pdf.image(constant.FILE_LOCATION+'public/upload/profile_pic/gu_Stamp.png',300,755,{fit: [85, 85], align: 'center'});
      // pdf.image(constant.FILE_LOCATION+'public/upload/profile_pic/sample_signature.jpeg',430,755,{width: 130,height: 80, align: 'center'});
      pdf.image(constant.FILE_LOCATION+'public/signedpdf/' + user_id + '/'+ app_id + '_attestation_qrcode.png',30,755,{width: 130,height: 80, align: 'left'});

      pdf.on('end', () => {
          resolve(Buffer.concat(pdfChunks));
      });
      const refs = addSignaturePlaceholder({
          pdf,
          reason: 'Approved',
          ...params.placeholder,
      });
      Object.keys(refs).forEach(key => refs[key].end());
      pdf.end();
  });

  const action = async () => {
      logger.debug("action called");
      let pdfBuffer = await createPdf();
      let p12Buffer = fs.readFileSync(constant.Certificate_Url+'certificateATT.pfx');
      var pdf = signer.sign(pdfBuffer, p12Buffer, { passphrase : constant.PASSPHRASE, asn1StrictParsing : true });
      try{
          var fpath = outputdirectory; //constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/";
          var fname ;
          fname = name + "_" + filename + '_notforpint'+ ".pdf";   
          var fullfile = fpath+fname;
          var file=fs.writeFileSync(fullfile,pdf);
          callback();
      }catch(error){
          logger.error("There is problem in generating signed pdf."+error);
          callback("There is problem in generating signed pdf.");
      }
  }

  action();
}
module.exports.signingDocuments_marksheet = async function(filename, user_id, app_id, file_loc, name,category, outputdirectory,callback){
  const createPdf = (params = {
      placeholder: { reason : 'Digital signed by University Of Gujarat' },
  }) => new Promise((resolve) => {
      const pdf = new PDFDocument({
          autoFirstPage: true,
          size: 'A4',
          layout: 'portrait',
          bufferPages: true,
          margins : { 
              top: 72, 
              bottom: 20,
              left: 72,
              right: 72
          },
          info: {
              Author: 'Gujarat University',
              Subject: 'Digital Signature', 
              CreationDate: moment.utc(Date.now()).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
          }
      });
      pdf.info.CreationDate = '';
      pdf.fillColor('#333').fontSize(25).moveDown().text(params.text);
      const pdfChunks = [];
      pdf.on('data', (data) => {
          pdfChunks.push(data);
      });
      // pdf.image(file_loc,0,0, {
      //     size: 'A4',
      //     align: 'center',
      //     width: 600,
      //     height:pdf.page.height - 90,
      //     note:'Digitally signed by University Of Gujarat',
      // }).moveDown(0.2);
      pdf.image(file_loc,0,0, {fit:[pdf.page.width,pdf.page.height - 90],
        size: 'A4',
        // align: 'center',
        // //width: 600,
        // height:pdf.page.height - 90,
        note:'Digitally signed by Gujarat University',
    }).moveDown(0.2);

      pdf.moveTo(20, pdf.page.height - 94)  
      .lineTo(pdf.page.width-20, pdf.page.height - 94)  
      .dash(10, {space: 0}) 
      .stroke() ;

        pdf.image(constant.FILE_LOCATION+'public/upload/profile_pic/marksheetStamp.png',250,755,{width: 160,height: 100, align: 'center'});
 
      
   
      // pdf.image(constant.FILE_LOCATION+'public/upload/profile_pic/gu_Stamp.png',300,755,{fit: [85, 85], align: 'center'});
      // pdf.image(constant.FILE_LOCATION+'public/upload/profile_pic/sample_signature.jpeg',430,755,{width: 130,height: 80, align: 'center'});
      pdf.image(constant.FILE_LOCATION+'public/signedpdf/' + user_id + '/' + app_id + '_attestation_qrcode.png',30,755,{width: 110,height: 80, align: 'center'});
      pdf.on('end', () => {
          resolve(Buffer.concat(pdfChunks));
      });
      const refs = addSignaturePlaceholder({
          pdf,
          reason: 'Approved',
          ...params.placeholder,
      });
      Object.keys(refs).forEach(key => refs[key].end());
      pdf.end();
  });

  const action = async () => {
      logger.debug("action called");
      let pdfBuffer = await createPdf();
      let p12Buffer = fs.readFileSync(constant.Certificate_Url+'certificateATT.pfx');
      var pdf = signer.sign(pdfBuffer, p12Buffer, { passphrase : constant.PASSPHRASE, asn1StrictParsing : true });
      try{
          var fpath = outputdirectory; //constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/";
          var fname ;
          fname = name + "_" + filename + ".pdf";   
          var fullfile = fpath+fname;
          var file=fs.writeFileSync(fullfile,pdf);
          callback('',fname);
      }catch(error){
          logger.error("There is problem in generating signed pdf."+error);
          callback("There is problem in generating signed pdf.");
      }
  }

  action();
}
module.exports.signingDocuments_notforprint_marksheet = async function(filename, user_id, app_id, file_loc, name,category, outputdirectory,callback){
  const createPdf = (params = {
      placeholder: { reason : 'Digital signed by University Of Gujarat' },
  }) => new Promise((resolve) => {
      const pdf = new PDFDocument({
          // image : constant.FILE_LOCATION+'public/upload/profile_pic/x.png',
          autoFirstPage: true,
          size: 'A4',
          layout: 'portrait',
          bufferPages: true,
          margins : { 
              top: 72, 
              bottom: 20,
              left: 72,
              right: 72
          },
          info: {
              Author: 'Gujarat University',
              Subject: 'Digital Signature', 
              CreationDate: moment.utc(Date.now()).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'), 
          }
      });
      pdf.image(constant.FILE_LOCATION+'public/profile_pic/notforprint.jpg', {
        // cover: [pdf.page.width - 100, pdf.page.height - 100],
        align: 'center',
        valign: 'center',
      });

      pdf.info.CreationDate = '';
      pdf.fillColor('#333').fontSize(25).moveDown().text(params.text);
      const pdfChunks = [];
      pdf.on('data', (data) => {
          pdfChunks.push(data);
      });
      // pdf.image(file_loc,0,0, {
      //     size: 'A4',
      //     align: 'center',
      //     width: 600,
      //     height:pdf.page.height - 90,
      //     note:'Digitally signed by University Of Gujarat',
      // }).moveDown(0.2);
      pdf.image(file_loc,0,0, {fit:[pdf.page.width,pdf.page.height - 90],
        size: 'A4',
        // align: 'center',
        // //width: 600,
        // height:pdf.page.height - 90,
        note:'Digitally signed by Gujarat University',
    }).moveDown(0.2);
    
      pdf.moveTo(20, pdf.page.height - 92) 
      .lineTo( pdf.page.width-20, pdf.page.height - 92)
      .dash(10, {space: 0}) 
      .stroke() ;
      pdf.moveTo(20, pdf.page.height - 94)  
      .lineTo(pdf.page.width-20, pdf.page.height - 94)
      .dash(10, {space: 0}) 
      .stroke() ;
      // pdf.image(constant.FILE_LOCATION+'public/upload/profile_pic/notforprint.jpg', 0,0, {width: pdf.page.width, height: pdf.page.height});
      pdf.image(constant.FILE_LOCATION+'public/upload/profile_pic/marksheetStamp.png',300,765,{width: 160,height: 100, align: 'center'});
     
      // else{
      //   pdf.image(constant.FILE_LOCATION+'public/upload/profile_pic/marksheetStamp.png',300,765,{fit: [85, 85], align: 'center'});
      // }
      // pdf.image(constant.FILE_LOCATION+'public/upload/profile_pic/gu_Stamp.png',300,755,{fit: [85, 85], align: 'center'});
      // pdf.image(constant.FILE_LOCATION+'public/upload/profile_pic/sample_signature.jpeg',430,755,{width: 130,height: 80, align: 'center'});
      // pdf.image(constant.FILE_LOCATION+'public/signedpdf/' + user_id + '/'+app_id + '_attestation_qrcode.png',30,755,{width: 130,height: 80, align: 'left'});

      pdf.on('end', () => {
          resolve(Buffer.concat(pdfChunks));
      });
      const refs = addSignaturePlaceholder({
          pdf,
          reason: 'Approved',
          ...params.placeholder,
      });
      Object.keys(refs).forEach(key => refs[key].end());
      pdf.end();
  });

  const action = async () => {
      logger.debug("action called");
      let pdfBuffer = await createPdf();
      let p12Buffer = fs.readFileSync(constant.Certificate_Url+'certificateATT.pfx');
      var pdf = signer.sign(pdfBuffer, p12Buffer, { passphrase : constant.PASSPHRASE, asn1StrictParsing : true });
      try{
          var fpath = outputdirectory; //constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/";
          var fname ;
          fname = name + "_" + filename + '_notforpint'+ ".pdf";   
          var fullfile = fpath+fname;
          var file=fs.writeFileSync(fullfile,pdf);
          callback();
      }catch(error){
          logger.error("There is problem in generating signed pdf."+error);
          callback("There is problem in generating signed pdf.");
      }
  }

  action();
}

module.exports.mergeDocuments = async function (app_id,user_id, name,fileName,outputDirectory,mergefilesString, callback){
  logger.info("merge called for application no : ")
  var file_name = name + "_" + fileName + ".pdf";
  var outputfile = outputDirectory +  file_name ;
  var command = "pdfunite " + mergefilesString + " " + outputfile;
  const pdfunite = exec(command, function (error, stdout, stderr) {
      if (error) {
        logger.error(error.stack);
        logger.error('Error code: '+error.code);
        logger.error('Signal received: '+error.signal);
        callback(error);
      }else{
        callback();
      }
      logger.debug('Child Process STDOUT: '+stdout);
      logger.error('Child Process STDERR: '+stderr);
  });

  pdfunite.on('exit', function (code) {
      logger.debug('Child process exited with exit code '+code);
  });
}
module.exports.signingDocuments_provisional = async function(filename, user_id, app_id, file_loc, name,category, outputdirectory,callback){
  const createPdf = (params = {
      placeholder: { reason : 'Digital signed by University Of Gujarat' },
  }) => new Promise((resolve) => {
      const pdf = new PDFDocument({
          // image : constant.FILE_LOCATION+'public/upload/profile_pic/x.png',
          autoFirstPage: true,
          size: 'A4',
          layout: 'portrait',
          bufferPages: true,
          margins : { 
              top: 72, 
              bottom: 20,
              left: 72,
              right: 72
          },
          info: {
              Author: 'Gujarat University',
              Subject: 'Digital Signature', 
              CreationDate: moment.utc(Date.now()).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'), 
          }
      });
      pdf.image(constant.FILE_LOCATION+'public/profile_pic/notforprint.jpg', {
        // cover: [pdf.page.width - 100, pdf.page.height - 100],
        align: 'center',
        valign: 'center',
      });

      pdf.info.CreationDate = '';
      pdf.fillColor('#333').fontSize(25).moveDown().text(params.text);
      const pdfChunks = [];
      pdf.on('data', (data) => {
          pdfChunks.push(data);
      });
      // pdf.image(file_loc,0,0, {
      //     size: 'A4',
      //     align: 'center',
      //     width: 600,
      //     height:pdf.page.height - 90,
      //     note:'Digitally signed by University Of Gujarat',
      // }).moveDown(0.2);
      pdf.image(file_loc,0,0, {fit:[pdf.page.width,pdf.page.height - 90],
        size: 'A4',
        // align: 'center',
        // //width: 600,
        // height:pdf.page.height - 90,
        note:'Digitally signed by Gujarat University',
    }).moveDown(0.2);

      pdf.moveTo(20, pdf.page.height - 92) 
      .lineTo( pdf.page.width-20, pdf.page.height - 92)
      .dash(10, {space: 0}) 
      .stroke() ;
      pdf.moveTo(20, pdf.page.height - 94)  
      .lineTo(pdf.page.width-20, pdf.page.height - 94)
      .dash(10, {space: 0}) 
      .stroke() ;
      pdf.image(constant.FILE_LOCATION+'public/signedpdf/' + user_id + '/'+ app_id + '_attestation_qrcode.png',30,755,{width: 130,height: 80, align: 'left'});
      pdf.on('end', () => {
          resolve(Buffer.concat(pdfChunks));
      });
      const refs = addSignaturePlaceholder({
          pdf,
          reason: 'Approved',
          ...params.placeholder,
      });
      Object.keys(refs).forEach(key => refs[key].end());
      pdf.end();
  });

  const action = async () => {
      logger.debug("action called");
      let pdfBuffer = await createPdf();
      let p12Buffer = fs.readFileSync(constant.Certificate_Url+'certificateATT.pfx');
      var pdf = signer.sign(pdfBuffer, p12Buffer, { passphrase : constant.PASSPHRASE, asn1StrictParsing : true });
      try{
          var fpath = outputdirectory; //constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/";
          var fname ;
          fname = name + "_" + filename + ".pdf";   
          var fullfile = fpath+fname;
          var file=fs.writeFileSync(fullfile,pdf);
          callback('',fname);
      }catch(error){
          logger.error("There is problem in generating signed pdf."+error);
          callback("There is problem in generating signed pdf.");
      }
  }

  action();
}
module.exports.ssigningDocuments_provisional_notforprint = async function(filename, user_id, app_id, file_loc, name,category, outputdirectory,callback){
  const createPdf = (params = {
      placeholder: { reason : 'Digital signed by University Of Gujarat' },
  }) => new Promise((resolve) => {
      const pdf = new PDFDocument({
          // image : constant.FILE_LOCATION+'public/upload/profile_pic/x.png',
          autoFirstPage: true,
          size: 'A4',
          layout: 'portrait',
          bufferPages: true,
          margins : { 
              top: 72, 
              bottom: 20,
              left: 72,
              right: 72
          },
          info: {
              Author: 'Gujarat University',
              Subject: 'Digital Signature', 
              CreationDate: moment.utc(Date.now()).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'), 
          }
      });
      pdf.image(constant.FILE_LOCATION+'public/profile_pic/notforprint.jpg', {
        // cover: [pdf.page.width - 100, pdf.page.height - 100],
        align: 'center',
        valign: 'center',
      });

      pdf.info.CreationDate = '';
      pdf.fillColor('#333').fontSize(25).moveDown().text(params.text);
      const pdfChunks = [];
      pdf.on('data', (data) => {
          pdfChunks.push(data);
      });
      // pdf.image(file_loc,0,0, {
      //     size: 'A4',
      //     align: 'center',
      //     width: 600,
      //     height:pdf.page.height - 90,
      //     note:'Digitally signed by University Of Gujarat',
      // }).moveDown(0.2);
      pdf.image(file_loc,0,0, {fit:[pdf.page.width,pdf.page.height - 90],
        size: 'A4',
        // align: 'center',
        // //width: 600,
        // height:pdf.page.height - 90,
        note:'Digitally signed by Gujarat University',
    }).moveDown(0.2);

      pdf.moveTo(20, pdf.page.height - 92) 
      .lineTo( pdf.page.width-20, pdf.page.height - 92)
      .dash(10, {space: 0}) 
      .stroke() ;
      pdf.moveTo(20, pdf.page.height - 94)  
      .lineTo(pdf.page.width-20, pdf.page.height - 94)
      .dash(10, {space: 0}) 
      .stroke() ;
      pdf.image(constant.FILE_LOCATION+'public/signedpdf/' + user_id + '/'+ app_id + '_attestation_qrcode.png',30,755,{width: 130,height: 80, align: 'left'});
      pdf.on('end', () => {
          resolve(Buffer.concat(pdfChunks));
      });
      const refs = addSignaturePlaceholder({
          pdf,
          reason: 'Approved',
          ...params.placeholder,
      });
      Object.keys(refs).forEach(key => refs[key].end());
      pdf.end();
  });

  const action = async () => {
      logger.debug("action called");
      let pdfBuffer = await createPdf();
      let p12Buffer = fs.readFileSync(constant.Certificate_Url+'certificateATT.pfx');
      var pdf = signer.sign(pdfBuffer, p12Buffer, { passphrase : constant.PASSPHRASE, asn1StrictParsing : true });
      try{
          var fpath = outputdirectory; //constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/";
          var fname ;
          fname = name + "_" + filename + '_notforpint'+ ".pdf";   
          var fullfile = fpath+fname;
          var file=fs.writeFileSync(fullfile,pdf);
          callback();
      }catch(error){
          logger.error("There is problem in generating signed pdf."+error);
          callback("There is problem in generating signed pdf.");
      }
  }

  action();
}

module.exports.mergeAutoPrint = async function (name, fileName, outputDirectory, mergefilesString, callback){
  logger.info("merge called for : "+name, fileName)
  var file_name = name + "_" + fileName + ".pdf";
  var outputfile = outputDirectory +"/"+  file_name ;
  
  var command = "pdfunite " + mergefilesString + " " + outputfile;
  const pdfunite = exec(command, function (error, stdout, stderr) {
      if (error) {
        logger.error(error.stack);
        logger.error('Error code: '+error.code);
        logger.error('Signal received: '+error.signal);
        callback(error);
      }else{
        callback();
      }
      logger.debug('Child Process STDOUT: '+stdout);
      logger.error('Child Process STDERR: '+stderr);
  });

  pdfunite.on('exit', function (code) {
      logger.debug('Child process exited with exit code '+code);
  });
}

module.exports.mergeCoverAppPrint = async function (name, fileName, outputDirectory, mergefilesString, callback){
  logger.info("merge called for : "+name, fileName)
  var file_name = name + "_" + fileName + "_merge.pdf";
  var outputfile = outputDirectory +"/"+  file_name ;

  var command = "pdfunite " + mergefilesString + " " + outputfile;
  const pdfunite = exec(command, function (error, stdout, stderr) {
      if (error) {
        logger.error(error.stack);
        logger.error('Error code: '+error.code);
        logger.error('Signal received: '+error.signal);
        callback(error);
      }else{
        callback();
      }
      logger.debug('Child Process STDOUT: '+stdout);
      logger.error('Child Process STDERR: '+stderr);
  });

  pdfunite.on('exit', function (code) {
      logger.debug('Child process exited with exit code '+code);
  });
}

module.exports.signingDocuments_merge = async function(filename, user_id, app_id, file_loc, name,category, outputdirectory,callback){
  let enrollment = '';
  let course = '';
  let userdetails = await functions.getuserdetail(user_id);
  userdetails.enrollmentNo.forEach(function (enroll){
      enrollment = enroll.enrollmentNo + enrollment;
      course = enroll.course + course;
  })
  const createPdf = (params = {
      placeholder: { reason : 'Digital signed by University Of Gujarat' },
  }) => new Promise((resolve) => {
      const pdf = new PDFDocument({
          autoFirstPage: true,
          size: 'A4',
          layout: 'portrait',
          bufferPages: true,
          margins : { 
              top: 72, 
              bottom: 20,
              left: 72,
              right: 72
          },
          info: {
              Author: 'Gujarat University',
              Subject: 'Digital Signature', 
              CreationDate: moment.utc(Date.now()).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'), 
          }
      });
    
      pdf.info.CreationDate = '';
      pdf.fillColor('#333').fontSize(25).moveDown().text(params.text);
      const pdfChunks = [];
      pdf.on('data', (data) => {
          pdfChunks.push(data);
      });
      pdf.image(file_loc,0,0, {
          size: 'A4',
          align: 'center',
          width: 600,
          height:pdf.page.height - 90,
          note:'Digitally signed by University Of Gujarat',
      }).moveDown(0.2);
      pdf.moveTo(20, pdf.page.height - 92) 
      .lineTo( pdf.page.width-20, pdf.page.height - 92) 
      .dash(10, {space: 0}) 
      .stroke() ;
      pdf.moveTo(20, pdf.page.height - 94)  
      .lineTo(pdf.page.width-20, pdf.page.height - 94)
      .dash(10, {space: 0}) 
      .stroke() ;
      pdf.text('',50,755,{fit: [85, 85], align: 'left'}).fontSize(9);
      pdf.text('Enrollment No:' + enrollment + '-' +course ,50,775,{fit: [85, 85], align: 'center'}).fontSize(9);
      pdf.text('Aadhar Number:' + userdetails.aadharNumber,50,755,{fit: [85, 85], align: 'center'}).fontSize(9);
      // pdf.text('Enrollment No :' + enrollment + ' - ' + course ,50,780,{fit: [85, 85], align: 'left'}).fontSize(12);
      
      pdf.on('end', () => {
          resolve(Buffer.concat(pdfChunks));
      });
      const refs = addSignaturePlaceholder({
          pdf,
          reason: 'Approved',
          ...params.placeholder,
      });
      Object.keys(refs).forEach(key => refs[key].end());
      pdf.end();
  });

  const action = async () => {
      logger.debug("action called");
      let pdfBuffer = await createPdf();
      let p12Buffer = fs.readFileSync(constant.Certificate_Url+'certificateATT.pfx');
      var pdf = signer.sign(pdfBuffer, p12Buffer, { passphrase : constant.PASSPHRASE, asn1StrictParsing : true });
      try{
          var fpath = outputdirectory; //constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/";
          var fname ;
          fname = name + "_" + filename + ".pdf";   
          var fullfile = fpath+fname;
          var file=fs.writeFileSync(fullfile,pdf);
          callback();
      }catch(error){
          logger.error("There is problem in generating signed pdf."+error);
          callback("There is problem in generating signed pdf.");
      }
  }

  action();
}


module.exports.imagetopdf = async function (inputDir,outputDir){
  var command = "img2pdf "+inputDir+ " -o " +outputDir;
  const img2pdf = exec(command, function (error, stdout, stderr) {
    if (error) {
      logger.error(error.stack);
      logger.error('Error code: '+error.code);
      logger.error('Signal received: '+error.signal);
    }else{
          logger.info("file created @ "+outputDir);
    }
    logger.debug('Child Process STDOUT: '+stdout);
    logger.error('Child Process STDERR: '+stderr);
  });
  img2pdf.on('exit', function (code) {
    logger.debug('Child process exited with exit code '+code);
  });
    }