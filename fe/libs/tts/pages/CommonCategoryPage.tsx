"use client";

import React, { useRef, useState } from "react";
import { Box, Typography, Button, Select, MenuItem } from "@mui/material";
import { Add as AddIcon, FileUpload as UploadIcon, Download as DownloadIcon } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { useStyles } from "@tts/logic/common-category/style";
import { InjuryFactorView } from "../components/common-category/InjuryFactorView";
import { InjuryTypeView } from "../components/common-category/InjuryTypeView";
import { OccupationView } from "../components/common-category/OccupationView";

export const CommonCategoryPage = () => {
  const classes = useStyles();
  const { enqueueSnackbar } = useSnackbar();
  const [category, setCategory] = useState("INJURY_FACTOR");
  const viewRef = useRef<any>(null);

  const handleAdd = () => {
    if (viewRef.current && viewRef.current.openAdd) {
      viewRef.current.openAdd();
    }
  };

  const handleExport = () => {
    enqueueSnackbar("Chức năng xuất danh sách đang được phát triển", { variant: "info" });
  };

  const handleImport = () => {
    enqueueSnackbar("Chức năng thêm từ file đang được phát triển", { variant: "info" });
  };

  return (
    <Box className={classes.root}>
      <Box className={classes.pageHeader}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
           <Typography className={classes.headerTitle}>Khai báo danh mục</Typography>
        </Box>
        <Box className={classes.actions}>
          <Button className={classes.importBtn} variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>
            Xuất danh sách
          </Button>
          <Button className={classes.importBtn} variant="outlined" startIcon={<UploadIcon />} onClick={handleImport}>
            Thêm từ file
          </Button>
          <Button className={classes.addBtn} variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
            Thêm mới
          </Button>
        </Box>
      </Box>

      <Box className={classes.mainContent} sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Box sx={{ mb: 2, width: 300 }}>
          <Select
            size="small"
            fullWidth
            value={category}
            onChange={(e) => setCategory(e.target.value as string)}
            sx={{ backgroundColor: '#fff' }}
          >
            <MenuItem value="INJURY_FACTOR">Yếu tố gây chấn thương</MenuItem>
            <MenuItem value="INJURY_TYPE">Loại chấn thương</MenuItem>
            <MenuItem value="BUSINESS_LINE">Danh mục nghề nghiệp</MenuItem>
          </Select>
        </Box>
        <Box className={classes.card} sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {category === "INJURY_FACTOR" && <InjuryFactorView ref={viewRef} />}
          {category === "INJURY_TYPE" && <InjuryTypeView ref={viewRef} />}
          {category === "BUSINESS_LINE" && <OccupationView ref={viewRef} />}
        </Box>
      </Box>
    </Box>
  );
};
