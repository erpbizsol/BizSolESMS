function CheckOptionPermission(Option, UserMaster_Code, UserModuleMaster_Code) {
    if (UserType !== 'A') {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: `${appBaseURL}/api/UserMaster/CheckUserOptionRight?UserModuleMaster_Code=${UserModuleMaster_Code}&UserMaster_Code=${UserMaster_Code}&Option=${Option}`,
                type: 'GET',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Auth-Key', authKeyData);
                },
                success: function (response) {
                    if (response.length > 0) {
                        if (response[0].Status == 'Y') {
                            resolve({ hasPermission: true, msg: response[0].Msg });
                        } else {
                            resolve({ hasPermission: false, msg: response[0].Msg });
                        }
                    } else {
                        resolve({ hasPermission: false, msg: 'No response, assume no permission' });
                    }
                },
                error: function (xhr, status, error) {
                    console.error("Error:", error);
                    reject(error);
                }
            });
        });
    } else {
        return Promise.resolve({ hasPermission: true, msg: 'Permission granted for Admin' });
    }
}

function CheckRelatedRecord(Code, TableName) {
   
        return new Promise((resolve, reject) => {
            $.ajax({
                url: `${appBaseURL}/api/Master/CheckRelatedRecord?Code=${Code}&TableName=${TableName}`,
                type: 'GET',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Auth-Key', authKeyData);
                },
                success: function (response) {
                    if (response.length > 0) {
                        if (response[0].Status == 'Y') {
                            resolve({ Status: true, msg1: response[0].Message });
                        } else {
                            resolve({ Status: false, msg1: response[0].Message });
                        }
                    } else {
                        resolve({ Status: false, msg1: 'No response, assume no permission' });
                    }
                },
                error: function (xhr, status, error) {
                    console.error("Error:", error);
                    reject(error);
                }
            });
        });
   
}