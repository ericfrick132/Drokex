import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  Card,
  CardMedia,
  CardContent,
  IconButton
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import PublicNavbar from '../components/layout/PublicNavbar';
import PublicFooter from '../components/layout/PublicFooter';
import { drokexColors } from '../theme/drokexTheme';

const About: React.FC = () => {
  const teamMembers = [
    {
      name: 'Ing. Maureen',
      lastName: 'Blandón Zavala',
      role: 'EMPRESARIA',
      image: '/assets/perfil_mauren.jpeg',
      description: `Empresaria nicaragüense e ingeniera industrial con más de 15 años de experiencia en el desarrollo y consolidación de marcas y proyectos empresariales en distintos países de Latinoamérica. Su trayectoria se ha enfocado en la optimización de procesos, la gestión organizacional, logística y financiera, así como en el fortalecimiento de estructuras empresariales con proyección regional. /n Como socia de Drokex, aporta su visión estratégica en productividad, organización y desarrollo empresarial, contribuyendo a la consolidación de la plataforma y al crecimiento de nuevas oportunidades comerciales en la región. Es reconocida por su liderazgo cercano, su enfoque humano y su capacidad de inspirar a otras mujeres a emprender y desarrollar proyectos con propósito.`
    },
    {
      name: 'Andrés',
      lastName: 'Carrillo Ávila',
      role: 'EMPRESARIO',
      image: '/assets/perfil_andres.jpeg',
      description: `Empresario colombiano con más de 25 años de trayectoria en la creación y desarrollo de marcas, proyectos empresariales y oportunidades comerciales en distintos países de Latinoamérica. Su experiencia se ha construido principalmente a partir de iniciativas propias, liderando negocios desde su concepción con inversión y riesgo empresarial directo, combinando visión empresarial, creatividad y estrategias de marketing para el desarrollo y posicionamiento de proyectos./n Como cofundador de Drokex, aporta su experiencia en desarrollo empresarial, marketing digital y apertura de mercados en Latinoamérica, especialmente en Centroamérica y el Caribe, contribuyendo a conectar empresas, proveedores y nuevas oportunidades comerciales en la región.`
    },
    {
      name: 'Luis',
      lastName: 'Urdaneta',
      role: 'EMPRESARIO',
      image: '/assets/perfil_luis.jpeg',
      description: `Empresario colombiano con más de 30 años de experiencia en comunicación estratégica, desarrollo de marca y marketing. Es fundador de la reconocida agencia Audiovisual Huella Digital en Colombia, desde donde ha liderado proyectos para importantes compañías y organizaciones como Grupo Bolivar, MetLife, Alpina, Mercedes-Benz, Homecenter, DHL, Tetra Pak, Oracle, Avianca, PepsiCo, entre otras marcas de alto reconocimiento./n Como socio de Drokex, aporta su amplia experiencia en comunicación, posicionamiento de marca y experiencia de usuario, contribuyendo a fortalecer la conexión entre las empresas, la plataforma y sus usuarios. Es reconocido en el medio por su liderazgo, visión estratégica y su calidad humana.`
    },
    {
      name: 'Javier Andrés',
      lastName: 'Hurtado Ariza',
      role: 'EMPRESARIO',
      image: '/assets/perfil_javier.jpeg',
      description: `Empresario colombiano y administrador de empresas con más de 25 años de experiencia en la creación, estructuración y consolidación de compañías en diversos sectores productivos. Actualmente se desempeña como CEO del Grupo Empresarial GEU, un conglomerado empresarial conformado por cinco compañías, desde donde lidera la estrategia corporativa y el desarrollo de nuevos proyectos empresariales./n Como socio de Drokex, aporta su experiencia en desarrollo empresarial y estructuración de negocios, contribuyendo al crecimiento de la plataforma y a la conexión entre empresas, oportunidades comerciales y nuevos mercados.`
    }
  ];

  const [selectedMember, setSelectedMember] = useState(teamMembers[0]);

  return (
    <Box sx={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Fixed Header */}
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1100 }}>
        <PublicNavbar />
      </Box>


      {/* Top section with background image */}
      <Box sx={{
        backgroundImage: 'url(/assets/fondo_drokex.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative'
      }}>
        <Container maxWidth="xl" sx={{ pt: 10, pb: 6, position: 'relative', zIndex: 2 }}>
        {/* Title */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h2" sx={{
            fontWeight: 400,
            fontSize: { xs: '2.5rem', md: '3rem' },
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            mb: 2
          }}>
            <Box component="span" sx={{ color: '#ffffff' }}>¿Quiénes</Box>{' '}
            <Box component="span" sx={{ color: '#c4ff47' }}>somos?</Box>
          </Typography>
        </Box>

        {/* Team Members Grid */}
        <Grid container spacing={3} sx={{ mb: 4, width: '66%' }} id="team-members-grid">
          {teamMembers.map((member) => (
            <Grid item xs={6} sm={3} key={member.name}>
              <Card sx={{
                backgroundColor: 'transparent',
                boxShadow: 'none',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)'
                }
              }} onClick={() => setSelectedMember(member)}>
                <Box sx={{
                  position: 'relative',
                  borderRadius: 4,
                  overflow: 'hidden',
                  border: selectedMember.name === member.name ? `3px solid ${drokexColors.primary}` : '3px solid rgba(255,255,255,0.3)',
                  '&:hover': {
                    border: `3px solid ${drokexColors.primary}`
                  }
                }}>
                  <CardMedia
                    component="img"
                    height="240"
                    image={member.image || '/assets/placeholder-team.svg'}
                    alt={member.name}
                    sx={{
                      objectFit: 'cover',
                      filter: 'brightness(0.8) contrast(1.1)'
                    }}
                  />
                  <IconButton sx={{
                    position: 'absolute',
                    bottom: 12,
                    right: 12,
                    backgroundColor: drokexColors.primary,
                    color: '#000',
                    width: 40,
                    height: 40,
                    '&:hover': {
                      backgroundColor: drokexColors.secondary,
                      transform: 'scale(1.1)'
                    }
                  }}>
                    <AddIcon sx={{ fontSize: 24 }} />
                  </IconButton>
                </Box>
                <CardContent sx={{ textAlign: 'center', pt: 2, pb: 1 }}>
                  <Typography variant="h5" sx={{
                    color: '#ffffff',
                    fontWeight: 700,
                    mb: 0.5,
                    fontSize: '1.5rem'
                  }}>
                    {member.name}
                  </Typography>
                  <Typography variant="body1" sx={{
                    color: drokexColors.primary,
                    fontWeight: 600,
                    letterSpacing: '1px',
                    fontSize: '0.9rem'
                  }}>
                    {member.role}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Selected Member Detail Card and Robot Hand */}
        {selectedMember.description && (
          <Box sx={{
            mb: 6,
            display: 'flex',
            alignItems: 'flex-start',
            width: '100%',
            position: 'relative'
          }} id="member-detail-section">
            {/* Left margin: 20% */}
            <Box sx={{ width: '20%' }} />

            {/* Card: 50% */}
            <Card sx={{
              width: '50%',
              backgroundColor: 'rgba(216, 222, 191, 0.3)',
              borderRadius: 6,
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(216, 222, 191, 0.3)',
              border: `2px solid rgba(76, 255, 146, 0.6)`,
              position: 'relative',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)'
            }} id="member-detail-card">
              <Grid container>
                <Grid item xs={12} md={4}>
                  <CardMedia
                    component="img"
                    height="350"
                    image={selectedMember.image || '/assets/placeholder-team.svg'}
                    alt={selectedMember.name}
                    sx={{
                      objectFit: 'cover',
                      height: { xs: 250, md: 350 },
                      padding: '1rem',
                      borderRadius: '48px'
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={8}>
                  <CardContent sx={{ p: { xs: 3, md: 4 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h3" sx={{
                      color: drokexColors.dark,
                      fontWeight: 500,
                      mb: 1,
                      fontSize: { xs: '2rem', md: '2.5rem' }
                    }}>
                      {selectedMember.name} {selectedMember.lastName}
                    </Typography>
                    <Typography variant="h5" sx={{
                      color: drokexColors.primary,
                      fontWeight: 400,
                      mb: 3,
                      letterSpacing: '2px',
                      fontSize: { xs: '1rem', md: '1.2rem' }
                    }}>
                      {selectedMember.role}
                    </Typography>
                    <Typography variant="body1" sx={{
                      color: drokexColors.dark,
                      lineHeight: 1.8,
                      fontSize: { xs: '1rem', md: '1.1rem' },
                      flex: 1,
                      whiteSpace: 'pre-line'
                    }}>
                      {selectedMember.description.replace(/\/n/g, '\n')}
                    </Typography>
                  </CardContent>
                </Grid>
              </Grid>
            </Card>

            {/* Right area with Robot Hand: 30% */}
            <Box sx={{
              width: '30%',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'flex-start',
              pr: { xs: 2, md: 4 }
            }}>
              <Box sx={{
                width: { xs: 150, md: 550 },
                height: { xs: 150, md: 550 },
                backgroundImage: 'url(/assets/mano_sin_fondo.png)',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                zIndex: 5,
                pointerEvents: 'none',
                filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.15))',
                transition: 'all 0.3s ease',
                position: 'relative',
                borderRadius: '15% 90% 20% 90%',
                
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(to right,         transparent 0%,         rgba(76, 255, 146, 0.1) 80%,         rgba(76, 255, 146, 0.7) 92%)',
                  pointerEvents: 'none',
                  zIndex: 1
                }
              }} id="robot-hand-image" />
            </Box>
          </Box>
        )}
        </Container>
      </Box>

      {/* Bottom section with black background */}
      <Box sx={{
        backgroundColor: '#000000',
        position: 'relative'
      }}>
        <Container maxWidth="xl" sx={{ py: 6, position: 'relative', zIndex: 2 }}>
        {/* Mission and Vision */}
        <Grid container spacing={6} sx={{ mb: 8 }} id="mission-vision-section">
          <Grid item xs={12} md={6}>
            <Box sx={{
              textAlign: 'center',
              color: '#ffffff'
            }}>
              <Typography variant="h3" sx={{
                color: drokexColors.primary,
                fontWeight: 700,
                mb: 3,
                fontSize: { xs: '2rem', md: '2.5rem' },
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}>
                Nuestra Misión
              </Typography>
              <Typography variant="h6" sx={{
                color: '#ffffff',
                lineHeight: 1.8,
                fontSize: { xs: '1.1rem', md: '1.3rem' },
                fontWeight: 400,
                textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
              }}>
                Conectar proveedores latinoamericanos con compradores
                internacionales, simplificando procesos de descubrimiento,
                contacto y comercio, sin necesidad de presencia física en destino.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{
              textAlign: 'center',
              color: '#ffffff'
            }}>
              <Typography variant="h3" sx={{
                color: drokexColors.primary,
                fontWeight: 700,
                mb: 3,
                fontSize: { xs: '2rem', md: '2.5rem' },
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}>
                Nuestro Enfoque
              </Typography>
              <Typography variant="h6" sx={{
                color: '#ffffff',
                lineHeight: 1.8,
                fontSize: { xs: '1.1rem', md: '1.3rem' },
                fontWeight: 400,
                textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
              }}>
                Apostamos por una experiencia ágil y confiable: catálogo claro,
                contacto directo mediante leads, y herramientas simples para
                empezar a exportar paso a paso.
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Call to Action Section */}
        <Box sx={{
          textAlign: 'center',
          mb: 6
        }} id="call-to-action-section">
          <Typography variant="h2" sx={{
            color: '#ffffff',
            fontWeight: 700,
            mb: 6,
            fontSize: { xs: '2.5rem', md: '3.5rem' },
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}>
            Quiero unirme a <Box component="span" sx={{ color: drokexColors.primary }}>Drokex</Box>
          </Typography>

          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                sx={{
                  backgroundColor: 'rgba(101, 67, 33, 0.9)',
                  color: '#ffffff',
                  py: 3,
                  px: 4,
                  borderRadius: 8,
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  lineHeight: 1.2,
                  minHeight: '100px',
                  border: '2px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(101, 67, 33, 1)',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.4)'
                  }
                }}
              >
                QUIERO
                <br />
                Vender productos
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                sx={{
                  backgroundColor: drokexColors.primary,
                  color: '#000000',
                  py: 3,
                  px: 4,
                  borderRadius: 8,
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  lineHeight: 1.2,
                  minHeight: '100px',
                  border: '2px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  '&:hover': {
                    backgroundColor: drokexColors.secondary,
                    transform: 'translateY(-3px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.4)'
                  }
                }}
              >
                QUIERO
                <br />
                Buscar proveedor
              </Button>
            </Grid>
          </Grid>
        </Box>
        </Container>
      </Box>

      <PublicFooter />
    </Box>
  );
};

export default About;