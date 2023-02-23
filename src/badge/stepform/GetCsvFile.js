import { Button, FormControlLabel, FormHelperText, Switch } from '@mui/material';
import { Box, Stack } from '@mui/system';
import React, { useContext } from 'react';
import CSVReader from 'react-csv-reader';
import { BadgeContext } from '../../context/BadgeContext';

const GetCsvFile = () => {
    const value = useContext(BadgeContext);
    return (
        <div className="container">
            <div className="row">
                <div className="col">
                    <Stack spacing={3} sx={{ margin: "20px" }}>
                        <span>Upload excel sheet of collectors data</span>
                        <Box sx={{ m: 1 }}>
                            <Button sx={{ m: 1 }} variant="contained" component="label">
                                Upload File
                                <CSVReader
                                    inputStyle={{ display: "none" }}
                                    onFileLoaded={(data) => { 
                                        data.shift();
                                        var result = data.map(function (row) {
                                            return {
                                                name: row[0],
                                            };
                                        });
                                        value.setCsvData(result);
                                    }}
                                />
                            </Button>
                        </Box>
                        <FormControlLabel
                        sx={{m:2}}
                            control={
                                <Switch
                                    name="transferable"
                                    onChange={value.setFormdata("transferable")}
                                />
                            }
                            label="Soulbound NFT"
                        />
                        <FormHelperText>Make your NFT non-transferable</FormHelperText>
                    </Stack>
                </div>
            </div>
        </div>
    );
};

export default GetCsvFile;