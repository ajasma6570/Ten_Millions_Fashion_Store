axios.get('/admin/chartData')
.then((response) => {
   

//********************************************************chart 1 Sale Statistics******************************************************
    if ($('#myChart').length) {
        var ctx = document.getElementById('myChart').getContext('2d');
        var chart = new Chart(ctx, {
          
            type: 'line',
            
           
            data: {
                labels: response.data.date,
                datasets: [{
                        label: 'Sales',
                        tension: 0.3,
                        fill: true,
                        backgroundColor: 'rgba(44, 120, 220, 0.2)',
                        borderColor: 'rgba(44, 120, 220)',
                        data: response.data.data
                    },
                   
                    

                ]
            },
            options: {
                plugins: {
                legend: {
                    labels: {
                    usePointStyle: true,
                    },
                }
                }
            }
        });
    } //End if

})
.catch(error => {
  console.error(error);
});






//******************************************************Chart 2 Revenue Based On Monthly Sales**************************************************
    axios.get('/admin/chartData2')
    .then((response) => {
      const data = response.data.data;
      const date = response.data.date;
  
      if ($('#myChart2').length) {
        var ctx = document.getElementById("myChart2");
        var myChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: date,
            datasets: [
              {
                label: "Sales",
                backgroundColor: "#5897fb",
                barThickness: 10,
                data: data
              }
            ]
          },
          options: {
            plugins: {
              legend: {
                labels: {
                  usePointStyle: true,
                },
              }
            },
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }
    })
    .catch(error => {
      console.error(error);
    });
    




//************************************************Chart 3 Category wise Sales************************************************************************

    const colors = ['#5897fb', '#7bcf86', '#ff9076','#8a2be2','#8a2be2'];
    axios.get('/admin/chartData3')
    .then((response) => {
      const data = response.data.data;
      const date = response.data.date;
      const category = response.data.categoryname;
    
      if ($('#myChart3').length) {
        var ctx = document.getElementById("myChart3");
        var myChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: date,
            datasets: category.map((cat, index) => {
              return {
                label: cat,
                backgroundColor:colors[index % colors.length],
                barThickness: 10,
                data: data[cat]
              };
            })
          },
          options: {
            plugins: {
              legend: {
                labels: {
                  usePointStyle: true,
                },
              }
            },
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }
    })
    .catch(error => {
      console.error(error);
    });
  



