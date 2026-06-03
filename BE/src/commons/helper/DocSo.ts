class DocSo {
  static doc1so(so) {
    const arr_chuhangdonvi = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    return arr_chuhangdonvi[so];
  }

  static doc2so(so) {
    so = so.replace(" ", "");
    const arr_chubinhthuong = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    const arr_chuhangdonvi = ["mươi", "mốt", "hai", "ba", "bốn", "lăm", "sáu", "bảy", "tám", "chín"];
    const arr_chuhangchuc = ["", "mười", "hai mươi", "ba mươi", "bốn mươi", "năm mươi", "sáu mươi", "bảy mươi", "tám mươi", "chín mươi"];
    let resualt = "";
    const sohangchuc = so.substr(0, 1);
    const sohangdonvi = so.substr(1, 1);
    resualt += arr_chuhangchuc[sohangchuc];
    if (sohangchuc == 1 && sohangdonvi == 1)
      resualt += " " + arr_chubinhthuong[sohangdonvi];
    else if (sohangchuc == 1 && sohangdonvi > 1)
      resualt += " " + arr_chuhangdonvi[sohangdonvi];
    else if (sohangchuc > 1 && sohangdonvi > 0)
      resualt += " " + arr_chuhangdonvi[sohangdonvi];
    return resualt;
  }

  static doc3so(so) {
    let resualt = "";
    const arr_chubinhthuong = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    const sohangtram = so.substr(0, 1);
    const sohangchuc = so.substr(1, 1);
    const sohangdonvi = so.substr(2, 1);
    resualt = arr_chubinhthuong[sohangtram] + " trăm";
    if (sohangchuc == 0 && sohangdonvi != 0)
      resualt += " linh " + arr_chubinhthuong[sohangdonvi];
    else if (sohangchuc != 0)
      resualt += " " + DocSo.doc2so(sohangchuc + " " + sohangdonvi);
    return resualt;
  }

  static docsonguyen(so) {
    let result = "";
    if (so != undefined) {
      const arr_So = [{ ty: "" }, { trieu: "" }, { nghin: "" }, { tram: "" }];
      const sochuso = so.length;
      for (let i = (sochuso - 1); i >= 0; i--) {
        if ((sochuso - i) <= 3) {
          if (arr_So["tram"] != undefined)
            arr_So["tram"] = so.substr(i, 1) + arr_So["tram"];
          else arr_So["tram"] = so.substr(i, 1);
        } else if ((sochuso - i) > 3 && (sochuso - i) <= 6) {
          if (arr_So["nghin"] != undefined)
            arr_So["nghin"] = so.substr(i, 1) + arr_So["nghin"];
          else arr_So["nghin"] = so.substr(i, 1);
        } else if ((sochuso - i) > 6 && (sochuso - i) <= 9) {
          if (arr_So["trieu"] != undefined)
            arr_So["trieu"] = so.substr(i, 1) + arr_So["trieu"];
          else arr_So["trieu"] = so.substr(i, 1);
        } else {
          if (arr_So["ty"] != undefined)
            arr_So["ty"] = so.substr(i, 1) + arr_So["ty"];
          else arr_So["ty"] = so.substr(i, 1);
        }
      }
      if (arr_So["ty"] > 0)
        result += DocSo.doc(arr_So["ty"]) + " tỷ";
      if (arr_So["trieu"] > 0) {
        if (arr_So["trieu"].length >= 3 || arr_So["ty"] > 0)
          result += " " + DocSo.doc3so(arr_So["trieu"]) + " triệu";
        else if (arr_So["trieu"].length >= 2)
          result += " " + DocSo.doc2so(arr_So["trieu"]) + " triệu";
        else result += " " + DocSo.doc1so(arr_So["trieu"]) + " triệu";
      }
      if (arr_So["nghin"] > 0) {
        if (arr_So["nghin"].length >= 3 || arr_So["trieu"] > 0)
          result += " " + DocSo.doc3so(arr_So["nghin"]) + " nghìn";
        else if (arr_So["nghin"].length >= 2)
          result += " " + DocSo.doc2so(arr_So["nghin"]) + " nghìn";
        else result += " " + DocSo.doc1so(arr_So["nghin"]) + " nghìn";
      }
      if (arr_So["tram"] > 0) {
        if (arr_So["tram"].length >= 3 || arr_So["nghin"] > 0)
          result += " " + DocSo.doc3so(arr_So["tram"]);
        else if (arr_So["tram"].length >= 2)
          result += " " + DocSo.doc2so(arr_So["tram"]);
        else result += " " + DocSo.doc1so(arr_So["tram"]);
      }
    }
    return result;
  }

  static doc(so) {
    const kytuthapphan = ",";
    let result = "";
    if (so != undefined) {
      so = " " + so + " ";
      so = so.trim();
      const cautrucso = so.split(kytuthapphan);
      if (cautrucso[0] != undefined) {
        result += DocSo.docsonguyen(cautrucso[0]);
      }
      if (cautrucso[1] != undefined) {
        result += " phẩy " + DocSo.docsonguyen(cautrucso[1]);
      }
    }
    return result;
  }
}

export default DocSo;
