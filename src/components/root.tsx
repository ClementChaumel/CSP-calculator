import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";

import Chart from "react-apexcharts";

import "../styles/global.css";
import {
  Body,
  Button,
  CardBackground,
  CardItem,
  Cell,
  Checkbox,
  ColumnHeaderCell,
  Header,
  NumberField,
  Row,
  Slider,
  Table,
  Tag,
  TextField,
  Typography,
} from "@hellocarbo/lasagne";
import { useState } from "react";

const formatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",

  // These options can be used to round to whole numbers.
  trailingZeroDisplay: "stripIfInteger", // This is probably what most people
  // want. It will only stop printing
  // the fraction when the input
  // amount is a round number (int)
  // already. If that's not what you
  // need, have a look at the options
  // below.
  //minimumFractionDigits: 0, // This suffices for whole numbers, but will
  // print 2500.10 as $2,500.1
  //maximumFractionDigits: 0, // Causes 2500.99 to be printed as $2,501
});

// source https://bofip.impots.gouv.fr/bofip/11255-PGP.html/identifiant=BOI-BAREME-000037-20240228
function calculerSalaireApresPrelevement(salaireMensuel: number) {
  let tauxApplicable = 0;

  if (salaireMensuel < 1591) {
    tauxApplicable = 0;
  } else if (salaireMensuel < 1653) {
    tauxApplicable = 0.005; // 0,5 %
  } else if (salaireMensuel < 1759) {
    tauxApplicable = 0.013; // 1,3 %
  } else if (salaireMensuel < 1877) {
    tauxApplicable = 0.021; // 2,1 %
  } else if (salaireMensuel < 2006) {
    tauxApplicable = 0.029; // 2,9 %
  } else if (salaireMensuel < 2113) {
    tauxApplicable = 0.035; // 3,5 %
  } else if (salaireMensuel < 2253) {
    tauxApplicable = 0.041; // 4,1 %
  } else if (salaireMensuel < 2666) {
    tauxApplicable = 0.053; // 5,3 %
  } else if (salaireMensuel < 3052) {
    tauxApplicable = 0.075; // 7,5 %
  } else if (salaireMensuel < 3476) {
    tauxApplicable = 0.099; // 9,9 %
  } else if (salaireMensuel < 3913) {
    tauxApplicable = 0.119; // 11,9 %
  } else if (salaireMensuel < 4566) {
    tauxApplicable = 0.138; // 13,8 %
  } else if (salaireMensuel < 5475) {
    tauxApplicable = 0.158; // 15,8 %
  } else if (salaireMensuel < 6851) {
    tauxApplicable = 0.179; // 17,9 %
  } else if (salaireMensuel < 8557) {
    tauxApplicable = 0.2; // 20 %
  } else if (salaireMensuel < 11877) {
    tauxApplicable = 0.24; // 24 %
  } else if (salaireMensuel < 16086) {
    tauxApplicable = 0.28; // 28 %
  } else if (salaireMensuel < 25251) {
    tauxApplicable = 0.33; // 33 %
  } else if (salaireMensuel < 54088) {
    tauxApplicable = 0.38; // 38 %
  } else {
    tauxApplicable = 0.43; // 43 %
  }

  const montantPrelevement = salaireMensuel * tauxApplicable;
  const salaireNet = salaireMensuel - montantPrelevement;

  // Retourne le résultat arrondi à 2 décimales
  return Math.round(salaireNet * 100) / 100;
}

const calculateRevenueArray = ({
  salary,
  seniority,
  accepted,
  hasNewJob,
  newJobMonths,
}: {
  salary: number;
  seniority: number;
  accepted: boolean;
  hasNewJob: boolean;
  newJobMonths: number;
}) => {
  const salaryNet = calculerSalaireApresPrelevement(salary);

  // const are = salary * 0.57;
  const are = salary * 0.6267275842;
  const areNet = calculerSalaireApresPrelevement(are);

  const asp = salary * 0.8942669267;
  const aspNet = calculerSalaireApresPrelevement(asp);

  const grossSalary = salary * 1.3263597944;

  const indemnity =
    (seniority >= 12 ? 0.333333 : 0.25) * grossSalary * ((seniority + 3) / 12);

  const revenueArray = [];

  revenueArray.push({
    salary: 0.7 * salaryNet, // 21 jours
    indemnity: 0,
  });

  if (accepted) {
    if (hasNewJob) {
      if (newJobMonths < 12) {
        for (let i = 1; i <= newJobMonths; i++) {
          revenueArray.push({
            salary: 0,
            indemnity: i === 1 ? indemnity + aspNet : aspNet,
          });
        }

        const remaininMonths = 12 - newJobMonths;
        const remainingASPValue =
          newJobMonths <= 10 ? aspNet * remaininMonths : 0;

        for (let i = 1; i <= 30; i++) {
          revenueArray.push({
            salary: salaryNet,
            indemnity: i === 1 || i === 12 ? remainingASPValue / 2 : 0,
          });
        }
      } else {
        for (let i = 1; i <= 12; i++) {
          revenueArray.push({
            salary: 0,
            indemnity: i === 1 ? indemnity + aspNet : aspNet,
          });
        }
        for (let i = 1; i <= 6; i++) {
          revenueArray.push({
            salary: newJobMonths - 12 >= i ? 0 : salaryNet,
            indemnity: newJobMonths - 12 >= i ? areNet : 0,
          });
        }
        for (let i = 1; i <= newJobMonths - 18; i++) {
          revenueArray.push({
            salary: newJobMonths - 12 >= i ? 0 : salaryNet,
            indemnity: 0,
          });
        }
      }
    } else {
      for (let i = 1; i <= 12; i++) {
        revenueArray.push({
          salary: 0,
          indemnity: i === 1 ? indemnity + aspNet : aspNet,
        });
      }

      for (let i = 1; i <= 6; i++) {
        revenueArray.push({
          salary: 0,
          indemnity: areNet,
        });
      }
    }
  } else {
    for (let i = 1; i <= 3; i++) {
      revenueArray.push({
        salary: salaryNet,
        indemnity: i === 3 ? indemnity : 0,
      });
    }

    if (hasNewJob) {
      if (newJobMonths < 18) {
        for (let i = 1; i <= newJobMonths; i++) {
          revenueArray.push({
            salary: 0,
            indemnity: areNet,
          });
        }
        for (let i = 1; i <= 18 - newJobMonths; i++) {
          revenueArray.push({
            salary: salaryNet,
            indemnity: 0,
          });
        }
      } else {
        for (let i = 1; i <= 18; i++) {
          revenueArray.push({
            salary: 0,
            indemnity: areNet,
          });
        }

        for (let i = 18; i <= newJobMonths; i++) {
          revenueArray.push({
            salary: 0,
            indemnity: 0,
          });
        }
      }
    } else {
      for (let i = 1; i <= 18; i++) {
        revenueArray.push({
          salary: 0,
          indemnity: areNet,
        });
      }
    }
  }

  const padLenght = 26 - revenueArray.length;

  for (let i = 0; i < padLenght; i++) {
    revenueArray.push({
      salary: hasNewJob ? salaryNet : 0,
      indemnity: 0,
    });
  }

  revenueArray.push({
    // to force the chart to start at 0
    salary: 0,
    indemnity: 0,
  });
  return revenueArray;
};

export default function Root() {
  const [salary, setSalary] = useState(2000);
  const [seniority, setSeniority] = useState(15);
  const [hasNewJob, setHasNewJob] = useState(false);
  const [newJobMonths, setNewJobMonths] = useState(0);

  const salaryNet = calculerSalaireApresPrelevement(salary);

  // const are = salary * 0.57;
  const are = salary * 0.6267275842;
  const areNet = calculerSalaireApresPrelevement(are);

  const asp = salary * 0.8942669267;
  const aspNet = calculerSalaireApresPrelevement(asp);

  const grossSalary = salary * 1.3263597944;

  const remaininMonths = 12 - newJobMonths;
  const remainingASPValue = newJobMonths <= 10 ? aspNet * remaininMonths : 0;

  const acceptedRevenueArray = calculateRevenueArray({
    salary,
    seniority,
    accepted: true,
    hasNewJob,
    newJobMonths,
  });
  const refusedRevenueArray = calculateRevenueArray({
    salary,
    seniority,
    accepted: false,
    hasNewJob,
    newJobMonths,
  });

  console.log({ acceptedRevenueArray });

  // get only the first 26 values
  const slicedacceptedRevenueArray = acceptedRevenueArray.slice(0, 26);
  const slicedrefusedRevenueArray = refusedRevenueArray.slice(0, 26);

  // console.log(refusedRevenueArray);

  const totalSalaryAccepted = slicedacceptedRevenueArray.reduce(
    (acc, { salary }) => acc + salary,
    0
  );

  console.log({ totalSalaryAccepted });

  const totalSalaryRefused = slicedrefusedRevenueArray.reduce(
    (acc, { salary }) => acc + salary,
    0
  );

  console.log({ totalSalaryRefused });
  const totalIndemniteAccepted = slicedacceptedRevenueArray.reduce(
    (acc, { indemnity }) => acc + indemnity,
    0
  );
  const totalIndemniteRefused = slicedrefusedRevenueArray.reduce(
    (acc, { indemnity }) => acc + indemnity,
    0
  );

  return (
    <div className={"pt-md sm:pt-xl pb-3xl px-xs sm:px-lg"}>
      <div className="mx-auto flex max-w-5xl flex-col gap-lg items-center justify-center">
        <Typography as="h1" step="5" className="text-center ">
          J'accepte ou pas ?
        </Typography>
        <div className="grid grid-cols-2 gap-md w-full">
          <CardItem>
            <div className="w-full flex justify-between items-center gap-md mb-md">
              <NumberField
                label="Salaire mensuel net"
                unit="€"
                min={0}
                value={salary}
                defaultValue={salary}
                onChange={setSalary}
              />
              <NumberField
                label="Ancienneté"
                unit="mois"
                min={0}
                defaultValue={seniority}
                onChange={setSeniority}
              />
            </div>
            <div className="flex flex-col gap-md">
              <Checkbox
                label="Retrouver un travail ? (au même salaire)"
                defaultChecked={hasNewJob}
                onCheckedChange={(checked) =>
                  setHasNewJob(checked === "indeterminate" ? false : checked)
                }
                name=""
              />
              {hasNewJob && (
                <Slider
                  label="Au bout de combien de mois ?"
                  min={1}
                  max={24}
                  defaultValue={12}
                  value={newJobMonths}
                  onChange={setNewJobMonths}
                />
              )}
            </div>
          </CardItem>
          <div className="flex flex-col gap-sm">
            <Table className="bg-white rounded-md  overflow-hidden ">
              <Header className="bg-grayscale-xx-light">
                <Row className="p-sm">
                  <ColumnHeaderCell className="p-md py-sm font-semibold">
                    Revenu
                  </ColumnHeaderCell>
                  <ColumnHeaderCell className="p-md py-sm font-semibold">
                    Montant mensuel
                  </ColumnHeaderCell>
                  <ColumnHeaderCell className="p-md py-sm font-semibold">
                    Après prélèvement
                  </ColumnHeaderCell>
                </Row>
              </Header>
              <Body>
                <Row className="hover:bg-grayscale-xx-light transition-colors">
                  <Cell className="p-md font-semibold">Salaire</Cell>
                  <Cell className="p-md text-right">
                    {formatter.format(salary)}
                  </Cell>
                  <Cell className="p-md text-right font-bold text-primary">
                    {formatter.format(salaryNet)}
                  </Cell>
                </Row>
                <Row className="hover:bg-grayscale-xx-light transition-colors">
                  <Cell className="p-md font-semibold">ASP</Cell>
                  <Cell className="p-md text-right">
                    {formatter.format(asp)}
                  </Cell>
                  <Cell className="p-md text-right font-bold text-primary">
                    {formatter.format(aspNet)}
                  </Cell>
                </Row>
                <Row className="hover:bg-grayscale-xx-light transition-colors">
                  <Cell className="p-md font-semibold">ARE</Cell>
                  <Cell className="p-md text-right">
                    {formatter.format(are)}
                  </Cell>
                  <Cell className="p-md text-right font-bold text-primary">
                    {formatter.format(areNet)}
                  </Cell>
                </Row>
              </Body>
            </Table>

            <CardItem className="grid grid-cols-[1fr_auto]  p-sm rounded-md">
              <Typography>Total ASP potentiel :</Typography>
              <Typography weight="bold">
                {formatter.format(aspNet * 12)}
              </Typography>
              <Typography>Prime ASP au réemploi : </Typography>
              <Typography weight="bold" className="text-primary">
                {formatter.format(remainingASPValue)}
              </Typography>
            </CardItem>
          </div>
        </div>

        <CardItem className="w-full">
          <Chart
            options={{
              stroke: {
                curve: "smooth",
              },
              chart: {
                id: "basic-line",
              },
              xaxis: {
                max: 26,
                categories: [
                  "nov",
                  "dec",
                  "jan 2026",
                  "fev",
                  "mar",
                  "avr",
                  "mai",
                  "jun",
                  "jui",
                  "aou",
                  "sep",
                  "oct",
                  "nov",
                  "dec",
                  "jan 2027",
                  "fev",
                  "mar",
                  "avr",
                  "mai",
                  "jun",
                  "jui",
                  "aou",
                  "sep",
                  "oct",
                  "nov",
                  "dec",
                  "jan 2028",
                  "fev",
                  "mar",
                  "avr",
                  "mai",
                  "jun",
                  "jui",
                  "aou",
                  "sep",
                  "oct",
                ],
              },
            }}
            series={[
              {
                name: "Revenus nets par mois si accepté",
                data: [
                  ...acceptedRevenueArray.map(({ salary, indemnity }) =>
                    Math.round(salary + indemnity)
                  ),
                ],
              },
              {
                name: "Revenus nets par mois si refusé",
                data: [
                  ...refusedRevenueArray.map(({ salary, indemnity }) =>
                    Math.round(salary + indemnity)
                  ),
                ],
              },
            ]}
            yaxis={{
              title: {
                text: "Revenu net",
              },
              min: 0,
            }}
            type="line"
            width="100%"
            height="400"
          />
        </CardItem>
        <div>
          <Typography step={5} weight="bold">
            Revenu Total
          </Typography>
          <Typography step={0} className="text-center">
            sur 26 mois
          </Typography>
        </div>
        <div className="flex gap-md">
          <CardItem className="text-center space-y-md">
            <Typography step={3} weight="semibold" className="mb-lg">
              ✅ Si CSP accepté
            </Typography>
            <Typography>
              <strong>{formatter.format(totalSalaryAccepted)}</strong> de
              salaire +{" "}
              <strong>{formatter.format(totalIndemniteAccepted)}</strong>{" "}
              d'indemnité
            </Typography>
            <Typography step={3} weight="bold" className="text-primary">
              {formatter.format(totalSalaryAccepted + totalIndemniteAccepted)}
            </Typography>
          </CardItem>
          <CardItem className="text-center space-y-md">
            <Typography step={3} weight="semibold" className="mb-lg">
              ❌ Si CSP refusé
            </Typography>
            <Typography>
              <strong>{formatter.format(totalSalaryRefused)}</strong> de salaire
              + <strong>{formatter.format(totalIndemniteRefused)}</strong>{" "}
              d'indemnité
            </Typography>
            <Typography step={3} weight="bold" className="text-primary">
              {formatter.format(totalSalaryRefused + totalIndemniteRefused)}
            </Typography>
          </CardItem>
        </div>
      </div>
    </div>
  );
}
